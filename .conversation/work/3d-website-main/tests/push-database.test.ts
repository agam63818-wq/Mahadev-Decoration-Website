import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const admin = '11111111-1111-4111-8111-111111111111'
const team = '22222222-2222-4222-8222-222222222222'
const customer = '33333333-3333-4333-8333-333333333333'
const migration = readFileSync('supabase/migrations/0016_booking_push.sql', 'utf8')

test('actual SQL migration: isolation, RLS, fanout, idempotency, retries and fencing', async (t) => {
  const db = new PGlite()
  // Minimal fixture for columns this additive migration reads; NOT a live-schema
  // verification or replacement of production migrations.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql as $$ select nullif(current_setting('request.jwt.claim.role',true),'') $$;
    grant usage on schema auth to authenticated,anon,service_role;
    create table public.profiles(id uuid primary key,role text not null default 'customer');
    alter table public.profiles enable row level security;
    create policy "profiles own row" on public.profiles for all using(id=auth.uid()) with check(id=auth.uid());
    grant select,insert,update,delete on public.profiles to authenticated;
    create table public.booking_requests(id uuid primary key default gen_random_uuid(),
      reference_number text,contact_name text,customer_name text,event_type text,event_date date,city text,
      selected_package_name_snapshot text,selected_item_title_snapshot text,selected_service_name_snapshot text,
      created_at timestamptz not null default now());
    insert into public.profiles values('${admin}','admin'),('${team}','team'),('${customer}','customer');
    insert into public.booking_requests(contact_name,created_at) values('Historical', now()-interval '2 days');
  `)
  await db.exec(migration)
  await db.exec(migration) // Idempotent rollout: does not move activation boundary.
  const scalar = async (sql: string) => (await db.query<Record<string, unknown>>(sql)).rows[0]
  const register = async (profile: string, device: string) => (await db.query<{ id: string }>(
    `select public.register_admin_push($1,$2,$3,$4,$5) as id`,
    [profile, `https://fcm.googleapis.com/fcm/send/${device}`, 'B'.repeat(87), 'A'.repeat(22), 'test-browser'],
  )).rows[0].id
  const insertBooking = async (name: string) => (await db.query<{ id: string }>(
    `insert into public.booking_requests(contact_name,event_type,event_date,city,selected_package_name_snapshot)
    values($1,'Wedding','2026-10-20','Ranchi','Premium') returning id`, [name],
  )).rows[0].id
  type Delivery = { delivery_id: string; lease_token: string; subscription_id: string; payload: { bookingId: string; customer: string; package: string } }
  const claim = async () => (await db.query<Delivery>('select * from public.claim_booking_push()')).rows
  const finish = async (d: Delivery, result: string) => (await db.query<{ done: boolean }>(
    'select public.finish_booking_push($1,$2,$3,$4,null) as done', [d.delivery_id, d.lease_token, result, result === 'sent' ? null : 'test_error'],
  )).rows[0].done
  let firstBooking = ''
  let deviceA = ''
  let leased: Delivery[] = []

  await t.test('committed booking persists without any devices or notification worker', async () => {
    firstBooking = await insertBooking('Rahul Kumar')
    assert.equal((await scalar('select count(*) from public.booking_requests')).count, 2)
    assert.equal((await scalar('select count(*) from public.booking_push_events')).count, 0)
    await db.exec('select public.prepare_booking_push()')
    assert.equal((await scalar('select count(*) from public.booking_push_events')).count, 1)
    assert.equal((await scalar('select count(*) from public.booking_push_deliveries')).count, 0)
    assert.equal((await scalar('select expanded_at from public.booking_push_events')).expanded_at, null)
  })

  await t.test('same endpoint upserts only for its owner; customer cannot register', async () => {
    deviceA = await register(admin, 'a')
    assert.equal(await register(admin, 'a'), deviceA)
    await assert.rejects(register(team, 'a'), /device_owned_by_another_account/)
    await assert.rejects(register(customer, 'customer'), /not_authorized/)
    await register(admin, 'b'); await register(team, 'c')
    assert.equal((await scalar('select count(*) from public.admin_push_subscriptions')).count, 3)
  })

  await t.test('fanout once per booking/device includes all authorized admins and snapshots', async () => {
    await db.exec('select public.prepare_booking_push(); select public.prepare_booking_push()')
    assert.equal((await scalar('select count(*) from public.booking_push_events')).count, 1)
    assert.equal((await scalar('select count(*) from public.booking_push_deliveries')).count, 3)
    leased = await claim()
    assert.equal(leased.length, 3)
    assert.equal(leased[0].payload.bookingId, firstBooking)
    assert.equal(leased[0].payload.customer, 'Rahul Kumar')
    assert.equal(leased[0].payload.package, 'Premium')
    assert.equal((await claim()).length, 0)
  })

  await t.test('successful devices are not resent; transient failure is delayed', async () => {
    assert.ok(await finish(leased[0], 'sent'))
    assert.ok(await finish(leased[1], 'retry'))
    assert.ok(await finish(leased[2], 'invalid'))
    assert.equal((await claim()).length, 0)
    assert.equal((await scalar(`select count(*) from public.admin_push_subscriptions where enabled=false`)).count, 1)
    await db.exec(`update public.booking_push_deliveries set next_attempt_at=now()-interval '1 minute' where status='pending'`)
    const retried = await claim()
    assert.equal(retried.length, 1)
    assert.ok(await finish(retried[0], 'sent'))
    assert.equal((await scalar('select count(*) from public.booking_requests')).count, 2)
  })

  await t.test('crashed worker lease expires; old acknowledgement cannot overwrite new lease', async () => {
    await insertBooking('Second booking')
    await db.exec('select public.prepare_booking_push()')
    const old = await claim()
    assert.equal(old.length, 2)
    await db.exec(`update public.booking_push_deliveries set lease_until=now()-interval '1 minute' where status='sending'`)
    const reclaimed = await claim()
    assert.equal(reclaimed.length, 2)
    assert.equal(await finish(old[0], 'sent'), false)
    for (const row of reclaimed) assert.ok(await finish(row, 'sent'))
  })

  await t.test('revoked staff authorization cancels pending device deliveries', async () => {
    await insertBooking('Third booking')
    await db.exec(`select public.prepare_booking_push(); update public.profiles set role='customer' where id='${admin}'; select public.prepare_booking_push()`)
    const due = await claim()
    assert.ok(due.every((row) => row.subscription_id !== deviceA))
    assert.ok(Number((await scalar(`select count(*) from public.booking_push_deliveries where status='cancelled'`)).count) >= 1)
    await db.exec(`update public.profiles set role='admin' where id='${admin}'`)
    for (const row of due) await finish(row, 'sent')
  })

  await t.test('customer cannot read subscriptions, mutate them, send or self-promote', async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.role='authenticated'; set request.jwt.claim.sub='${customer}'`)
    assert.equal((await scalar('select count(*) from public.admin_push_subscriptions')).count, 0)
    for (const query of [
      `select public.register_admin_push('${admin}','https://fcm.googleapis.com/evil','${'B'.repeat(87)}','${'A'.repeat(22)}','evil')`,
      'select public.prepare_booking_push()', 'select public.claim_booking_push()',
      'select * from public.booking_push_events', 'select * from public.booking_push_deliveries',
      'delete from public.admin_push_subscriptions',
      `update public.profiles set role='admin' where id='${customer}'`,
    ]) await assert.rejects(db.exec(query))
    await db.exec(`set request.jwt.claim.sub='${admin}'`)
    assert.equal((await scalar('select count(*) from public.admin_push_subscriptions')).count, 2)
    await assert.rejects(db.exec('update public.admin_push_subscriptions set enabled=true'))
    await db.exec(`reset role; set request.jwt.claim.role=''; set request.jwt.claim.sub=''`)
  })

  await t.test('database unique submission key rejects concurrent duplicate records', async () => {
    const key = '88888888-8888-4888-8888-888888888888'
    const inserts = await Promise.allSettled([1, 2].map(() => db.exec(`insert into public.booking_requests(submission_key) values('${key}')`)))
    assert.equal(inserts.filter((item) => item.status === 'fulfilled').length, 1)
    assert.equal(inserts.filter((item) => item.status === 'rejected').length, 1)
  })

  await t.test('queue unavailable still does not block booking insert', async () => {
    await db.exec('alter table public.booking_push_events rename to unavailable_events')
    const id = await insertBooking('Notification outage')
    assert.ok(id)
    await assert.rejects(db.exec('select public.prepare_booking_push()'))
    assert.equal((await scalar(`select contact_name from public.booking_requests where id='${id}'`)).contact_name, 'Notification outage')
    await db.exec('alter table public.unavailable_events rename to booking_push_events')
  })

  await t.test('retry exhaustion and expiration are terminal; deleted booking cascades safely', async () => {
    await db.exec('select public.prepare_booking_push()')
    await db.exec(`update public.booking_push_deliveries set attempt_count=8,lease_until=now()-interval '1 minute' where status='pending'; select public.prepare_booking_push()`)
    assert.equal((await claim()).length, 0)
    assert.ok(Number((await scalar(`select count(*) from public.booking_push_deliveries where status='failed'`)).count) > 0)
    await db.exec(`delete from public.booking_requests where id='${firstBooking}'`)
    assert.equal((await scalar(`select count(*) from public.booking_push_events where booking_request_id='${firstBooking}'`)).count, 0)
  })
  await t.test('expired events never deliver; anonymous callers cannot access queue RPCs', async () => {
    const id = await insertBooking('Expired event')
    await db.exec('select public.prepare_booking_push()')
    await db.exec(`update public.booking_push_events set expires_at=now()-interval '1 minute' where booking_request_id='${id}'; select public.prepare_booking_push()`)
    assert.equal((await claim()).length, 0)
    assert.ok(Number((await scalar(`select count(*) from public.booking_push_deliveries where status='expired'`)).count) > 0)
    await db.exec('set role anon')
    await assert.rejects(db.exec('select * from public.admin_push_subscriptions'))
    await assert.rejects(db.exec('select public.claim_booking_push()'))
    await db.exec('reset role; set role service_role')
    await db.exec('select public.prepare_booking_push(); select * from public.claim_booking_push()')
    await db.exec('reset role')
  })
  await db.close()
})
