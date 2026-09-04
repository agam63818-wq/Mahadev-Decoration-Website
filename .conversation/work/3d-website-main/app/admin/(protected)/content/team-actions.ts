'use server'

// ─── Team members admin actions (PART 3 §14–§16) ──────────────────────────────
//
// Backed by the table that ALREADY EXISTS: public.team_members (migration
// 0006). No new migration is added for this feature — §14 explicitly says to
// use the existing table, and §22 says only add a migration when required.
//
// Columns written here are exactly the ones migration 0006 defines:
//   name, role, photo_url, phone, is_active, sort_order
// `id`, `created_at` and `updated_at` are managed by the database.
//
// §16: the image path deliberately reuses the SAME safe-upload architecture and
// the SAME bucket as services/occasions/packages — `card-images`, under the
// `team/` entity folder that lib/admin/media.ts already allows. A second bucket
// or a second upload routine would mean two places to get security wrong.
//
// Auth chain (identical to services/actions.ts on purpose):
//   middleware guards navigation → getAdminUser() guards the action itself
//   (a Server Action is an independently callable endpoint, so a page-level
//   check is not enough) → RLS `public.is_admin()` is the final authority.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseWriteClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth/session'
import { CARD_IMAGES_BUCKET } from '@/lib/supabase/config'
import {
  buildCardImagePath,
  isManagedBucketPath,
  validateImageFile,
} from '@/lib/admin/media'
import type { TeamMemberRow } from '@/lib/supabase/database.types'

export interface ActionResult {
  ok: boolean
  error?: string
  id?: string
}

type TeamUpdate = Partial<Omit<TeamMemberRow, 'id' | 'created_at' | 'updated_at'>>

/**
 * The team cards are rendered on /about and nowhere else, so that is the only
 * public path that needs busting — plus the admin page itself.
 */
function revalidateTeam() {
  revalidatePath('/about')
  revalidatePath('/admin/content')
}

async function requireAdminClient() {
  const admin = await getAdminUser()
  if (!admin) return { error: 'अनुमति नहीं है। कृपया दोबारा लॉगिन करें।' as string, supabase: null }

  const supabase = getSupabaseWriteClient()
  if (!supabase) return { error: 'Supabase कॉन्फ़िगर नहीं है।' as string, supabase: null }

  return { error: null, supabase }
}

// ─── Save (insert + update) ───────────────────────────────────────────────────

const memberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'नाम जरूरी है').max(120, 'नाम बहुत लंबा है'),
  role: z.string().trim().max(120, 'पद बहुत लंबा है').optional().default(''),
  // Loose on purpose: Indian numbers get written as "+91 98765 43210",
  // "098765-43210" etc. Rejecting a valid number the owner types every day is
  // worse than storing it with spaces. Empty is allowed — phone is optional.
  phone: z
    .string()
    .trim()
    .max(20, 'फ़ोन नंबर बहुत लंबा है')
    .refine((v) => v === '' || /^\+?[\d\s-]{7,20}$/.test(v), 'फ़ोन नंबर सही नहीं लग रहा')
    .optional()
    .default(''),
})

export async function saveTeamMember(input: unknown): Promise<ActionResult> {
  const parsed = memberSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const v = parsed.data

  // Typed as the table's Update shape so a mistyped column is a COMPILE error.
  // PostgREST silently ignores unknown keys on write, so an untyped object
  // would let a typo look like a successful save that changed nothing.
  const patch: TeamUpdate = {
    name: v.name,
    role: v.role,
    // Empty input clears the number rather than storing '' — NULL is what
    // "no phone recorded" means in this table.
    phone: v.phone ? v.phone : null,
  }

  if (v.id) {
    const { error } = await supabase.from('team_members').update(patch).eq('id', v.id)
    if (error) return { ok: false, error: error.message }
    revalidateTeam()
    return { ok: true, id: v.id }
  }

  // New member goes to the END of the list so the existing display order on
  // /about is untouched.
  const { data: lastRow } = await supabase
    .from('team_members')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort = ((lastRow as { sort_order?: number } | null)?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      ...patch,
      // photo_url stays NULL: the About card already falls back to the
      // member's initial. Writing a placeholder path would render broken.
      photo_url: null,
      is_active: true,
      sort_order: nextSort,
    })
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }

  revalidateTeam()
  return { ok: true, id: (data as { id: string } | null)?.id }
}

// ─── Active toggle ────────────────────────────────────────────────────────────

const toggleSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
})

/**
 * Separate from `saveTeamMember` so hiding a member can never accidentally
 * rewrite their name/role with whatever the card was holding in memory.
 */
export async function setTeamMemberActive(input: unknown): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'अमान्य जानकारी' }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const { error } = await supabase
    .from('team_members')
    .update({ is_active: parsed.data.isActive })
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: error.message }

  revalidateTeam()
  return { ok: true, id: parsed.data.id }
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderTeamMembers(orderedIds: string[]): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: 'क्रम की जानकारी नहीं मिली' }
  }

  /*
   * §21 — HONEST NOTE ON ATOMICITY.
   *
   * This is a sequence of independent UPDATEs, NOT a transaction. If the
   * connection drops halfway, some rows carry the new sort_order and some the
   * old one. That is survivable here and deliberately not hidden:
   *   - the only consequence is a wrong display ORDER, never lost data;
   *   - the whole list is rewritten on every reorder, so the very next
   *     successful reorder repairs any partial state completely;
   *   - we stop at the first error and report it, so the owner knows the order
   *     did not fully apply instead of being told it succeeded.
   * A Postgres RPC would make it atomic; that is a bigger change than the
   * problem justifies, so it is documented rather than silently assumed.
   */
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await supabase
      .from('team_members')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
    if (error) return { ok: false, error: error.message }
  }

  revalidateTeam()
  return { ok: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteTeamMember(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'कौन सा सदस्य? id नहीं मिली।' }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  // Read the photo BEFORE the row disappears: afterwards there is no way to
  // learn which object belonged to it and it would be orphaned forever.
  const { data: existing } = await supabase
    .from('team_members')
    .select('photo_url')
    .eq('id', id)
    .maybeSingle()

  const row = existing as { photo_url: string | null } | null

  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  // Best-effort, and deliberately AFTER the row delete: a failed cleanup leaves
  // a harmless orphan object, whereas deleting the object first and then
  // failing the row delete would leave a visibly broken card on /about.
  if (row?.photo_url && isManagedBucketPath(row.photo_url)) {
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([row.photo_url])
  }

  revalidateTeam()
  return { ok: true, id }
}

// ─── Photo upload (§16 — same 7-step ordering as every other card) ────────────

/**
 *   1. validate MIME + size (again — the browser check was only UI)
 *   2. generate the object path SERVER-side; the client filename is ignored
 *   3. upload with `upsert: false`
 *   4. read the PREVIOUS photo_url
 *   5. update the row
 *   6. if the row update fails → delete the JUST-UPLOADED object and bail,
 *      leaving the old photo still referenced and still present
 *   7. only once the row is committed, delete the previous object — and only
 *      if it is one of ours (`isManagedBucketPath`), never an arbitrary URL
 */
export async function uploadTeamMemberImage(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '')
  const file = formData.get('file')

  if (!id) return { ok: false, error: 'कौन सा सदस्य? id नहीं मिली।' }

  const check = validateImageFile(file)
  if (!check.ok) return { ok: false, error: check.error }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  let objectPath: string
  try {
    objectPath = buildCardImagePath('team', id, check.ext)
  } catch {
    return { ok: false, error: 'अमान्य id' }
  }

  const upload = await supabase.storage
    .from(CARD_IMAGES_BUCKET)
    .upload(objectPath, file as File, { contentType: check.mime, upsert: false })

  if (upload.error) {
    // Nothing was written to the row, so the old photo is still live.
    return { ok: false, error: 'फोटो अपलोड नहीं हो सकी।' }
  }

  const { data: prev } = await supabase
    .from('team_members')
    .select('photo_url')
    .eq('id', id)
    .maybeSingle()
  const prevRow = prev as { photo_url: string | null } | null

  const { error: updateError } = await supabase
    .from('team_members')
    .update({ photo_url: objectPath })
    .eq('id', id)

  if (updateError) {
    // Roll the storage side back so a failed save leaves no orphan object.
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([objectPath])
    return { ok: false, error: 'फोटो सेव नहीं हो सकी। फिर कोशिश करें।' }
  }

  if (prevRow?.photo_url && isManagedBucketPath(prevRow.photo_url)) {
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([prevRow.photo_url])
  }

  revalidateTeam()
  return { ok: true, id }
}
