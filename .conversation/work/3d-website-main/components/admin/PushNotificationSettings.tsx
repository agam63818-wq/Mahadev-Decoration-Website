'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { disablePushDevice, getPushDevice, registerPushDevice, testPushDevice } from '@/lib/push/actions'
import { pushRegistration, supportsPush, vapidBytes } from '@/lib/push/browser'

export function PushNotificationSettings() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('स्थिति जाँची जा रही है…')
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  const refresh = useCallback(async () => {
    const supported = supportsPush()
    setSupported(supported)
    if (!supported) { setMessage('Push के लिए HTTPS पर Android Chrome या supported browser खोलें। iPhone पर पहले Add to Home Screen करें।'); setBusy(false); return }
    setPermission(Notification.permission)
    try {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const subscription = await registration?.pushManager.getSubscription()
      const result = await getPushDevice(subscription?.endpoint)
      setEnabled(result.ok && result.enabled && Notification.permission === 'granted')
      setMessage(result.ok ? '' : result.error ?? 'स्थिति उपलब्ध नहीं है।')
    } catch { setMessage('स्थिति नहीं मिली। Network या login जाँचकर refresh करें।') }
    finally { setBusy(false) }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function enable() {
    if (!publicKey) { setMessage('Owner को VAPID keys configure करनी होंगी।'); return }
    setBusy(true); setMessage('')
    try {
      // Permission is requested ONLY from a deliberate user gesture.
      const permission = await Notification.requestPermission()
      setPermission(permission)
      if (permission !== 'granted') {
        setMessage(permission === 'denied' ? 'Browser Site Settings में Notifications Allow करें, फिर कोशिश करें।' : 'Permission नहीं दी गई। जब तैयार हों, Enable फिर दबाएँ।')
        return
      }
      const registration = await pushRegistration()
      let subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const key = subscription.options.applicationServerKey
        const expected = vapidBytes(publicKey)
        if (key && (key.byteLength !== expected.byteLength || new Uint8Array(key).some((byte, i) => byte !== expected[i]))) {
          const disabled = await disablePushDevice(subscription.endpoint)
          if (!disabled.ok) throw new Error(disabled.error)
          await subscription.unsubscribe()
          subscription = null
        }
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidBytes(publicKey) })
      const result = await registerPushDevice(subscription.toJSON())
      if (!result.ok) throw new Error(result.error)
      setEnabled(true)
      setMessage('इस डिवाइस पर notifications enabled हैं। एक टेस्ट भेजकर जाँचें।')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Push Enable नहीं हुआ। दोबारा कोशिश करें।') }
    finally { setBusy(false) }
  }

  async function deviceAction(test: boolean) {
    setBusy(true); setMessage('')
    try {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const subscription = await registration?.pushManager.getSubscription()
      if (!subscription) { setEnabled(false); throw new Error('डिवाइस subscription नहीं मिला। फिर Enable करें।') }
      const result = test ? await testPushDevice(subscription.endpoint) : await disablePushDevice(subscription.endpoint)
      if (!result.ok) throw new Error(result.error)
      if (!test) {
        await subscription.unsubscribe()
        setEnabled(false)
        const notifications = await registration?.getNotifications()
        notifications?.forEach((notification) => notification.close())
      }
      setMessage(test ? 'Push service ने टेस्ट स्वीकार किया। अब डिवाइस पर notification जाँचें।' : 'इस डिवाइस के notifications बंद हैं।')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'कृपया दोबारा कोशिश करें।') }
    finally { setBusy(false) }
  }

  return <section className="rounded-2xl border border-gold/20 bg-bg-purple/40 p-5" aria-labelledby="push-heading">
    <h2 id="push-heading" className="flex items-center gap-2 font-devanagari text-lg font-semibold text-gold"><Bell size={20} /> Booking Notifications</h2>
    <p className="mt-2 font-devanagari text-sm text-champagne">{enabled ? 'इस डिवाइस पर Notifications enabled' : 'इस डिवाइस पर Notifications enabled नहीं हैं'}</p>
    <p className="mt-2 font-devanagari text-xs text-text-muted">नई बुकिंग की सूचना background में भी मिल सकती है। Shared डिवाइस पर Enable न करें: ग्राहक का नाम और इवेंट lock screen पर दिखेगा। Logout पर इस डिवाइस की subscription हटाई जाएगी; दोबारा login के बाद Enable करें।</p>
    {permission === 'denied' && <p className="mt-3 font-devanagari text-sm text-gold">Permission blocked है। Browser Site Settings → Notifications → Allow करें।</p>}
    <p role="status" aria-live="polite" className="mt-3 font-devanagari text-sm text-text-muted">{message}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      {!enabled && <Button size="sm" onClick={enable} disabled={busy || !supported || permission === 'denied'}>Enable Notifications</Button>}
      {enabled && <><Button size="sm" variant="secondary" onClick={() => deviceAction(true)} disabled={busy}>Test Notification</Button><Button size="sm" variant="secondary" onClick={() => deviceAction(false)} disabled={busy}>Disable this device</Button></>}
      <Button size="sm" variant="secondary" onClick={refresh} disabled={busy}>Refresh status</Button>
    </div>
  </section>
}
