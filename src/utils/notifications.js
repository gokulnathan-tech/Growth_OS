import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { TAMIL_QUOTES } from '../data/tamilQuotes';

const MORNING_WISHES = [
  "🌞 இன்றைய நாள் வெற்றிகரமான நாளாக அமையட்டும்!",
  "🚀 உங்கள் நாள் வெற்றியும் முன்னேற்றமும் அமையட்டும்!",
  "💎 உங்கள் செயல்கள் இன்று பலருக்கு ஊக்கமாக அமையட்டும்!",
  "💪 ஒவ்வொரு அடியும் வெற்றியை நோக்கி அமையட்டும்!",
  "🌟 நம்பிக்கையும் வெற்றியும் நிறைந்த இனிய நாள்!"
];

async function setupCustomChannel() {
  if (Capacitor.getPlatform() === 'android') {
    try {
      await LocalNotifications.deleteChannel({ id: 'growthos_alerts' });
    } catch (e) {}

    await LocalNotifications.createChannel({
      id: 'growthos_alerts_v2',
      name: 'Growth OS Alerts',
      description: 'Notifications with custom sounds',
      sound: 'notification_sound',
      importance: 5,
      visibility: 1,
      vibration: true
    });
  }
}

// Global Listener with exact route paths matched to your project structure
export function initNotificationListeners(navigate, showPopupCallback) {
  LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
    const extraData = notificationAction.notification.extra || {};
    const type = extraData.type;

    if (type === 'morning_quote') {
      navigate('/');
      if (typeof showPopupCallback === 'function') {
        showPopupCallback({
          title: notificationAction.notification.title || "🌞 இனிய காலை வணக்கம்!",
          message: notificationAction.notification.body
        });
      }
    } else if (type === 'kyc_reminder') {
      navigate('/team'); 
    } else if (type === 'target_alert' || type === 'custom_alert') {
      // Target management has been retired; generic broadcasts open the dashboard.
      navigate('/');
    } else {
      navigate('/');
    }
  });
}

// Schedule morning/evening quotes and team KYC reminders
export async function scheduleDailyQuoteNotification() {
  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    await setupCustomChannel();

    const pending = await LocalNotifications.getPending();
    if (pending.notifications && pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    const morningWish = MORNING_WISHES[Math.floor(Math.random() * MORNING_WISHES.length)];
    const quote2 = TAMIL_QUOTES[Math.floor(Math.random() * TAMIL_QUOTES.length)];
    
    // STRICT CHECK: Scan actual team members list in localStorage to see if ANY member has pending KYC, NEFT, or PAN
    let isKycPending = false;
    try {
      const teamMembers = JSON.parse(localStorage.getItem('growth_os_team_members') || '[]');
      if (teamMembers.length > 0) {
        // Check if any member has kycDone, neftDone, or panDone as false/pending
        const pendingMembers = teamMembers.filter(m => !m.kycDone || !m.neftDone || !m.panDone);
        if (pendingMembers.length > 0) {
          isKycPending = true;
        }
      } else {
        // Fallback: If no members added yet or key doesn't exist, check legacy flag or default to false
        const legacyKyc = localStorage.getItem('growth_os_kyc_completed');
        if (legacyKyc === 'false') isKycPending = true;
      }
    } catch (e) {
      isKycPending = false;
    }

    const now = new Date();

    const time5AM = new Date();
    time5AM.setHours(5, 0, 0, 0);
    if (now > time5AM) time5AM.setDate(time5AM.getDate() + 1);

    const time6PM = new Date();
    time6PM.setHours(18, 0, 0, 0);
    if (now > time6PM) time6PM.setDate(time6PM.getDate() + 1);

    const timeTwoDaysReminder = new Date();
    timeTwoDaysReminder.setHours(9, 30, 0, 0);
    if (now > timeTwoDaysReminder) timeTwoDaysReminder.setDate(timeTwoDaysReminder.getDate() + 1);

    // Base notification array (Morning & Evening Quotes daily)
    const notificationsToSchedule = [
      {
        body: morningWish,
        id: 101,
        schedule: { at: time5AM, every: 'day' },
        channelId: 'growthos_alerts_v2',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#7e22ce',
        sound: 'notification_sound',
        extra: { type: 'morning_quote' }
      },
      {
        body: quote2,
        id: 103,
        schedule: { at: time6PM, every: 'day' },
        channelId: 'growthos_alerts_v2',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#7e22ce',
        sound: 'notification_sound',
        extra: { type: 'morning_quote' }
      }
    ];

    // STRICT CONDITION: Push KYC reminder ONLY if someone has pending/cross mark, and set to 'two-days' interval instead of daily!
    if (isKycPending) {
      notificationsToSchedule.push({
        title: "🛡️ Team KYC Pending Alert",
        body: "⚠️ உங்களுடைய டீம் KYC/NEFT இன்னும் முடிக்கப்படவில்லை, உடனடியாக சரிபார்க்கவும்!",
        id: 104,
        schedule: { at: timeTwoDaysReminder, every: 'two-days' }, // Triggers strictly every 2 days
        channelId: 'growthos_alerts_v2',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#7e22ce',
        sound: 'notification_sound',
        extra: { type: 'kyc_reminder' }
      });
    }

    await LocalNotifications.schedule({
      notifications: notificationsToSchedule
    });
  } catch (e) {
    console.log('Notification error:', e);
  }
}

export async function sendCustomAdminNotification(customTitle, customMessage, scheduledTime = null) {
  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;
    await setupCustomChannel();
    let triggerTime = new Date(new Date().getTime() + 1000);
    if (scheduledTime) {
      const userSelectedDate = new Date(scheduledTime);
      if (userSelectedDate > new Date()) {
        triggerTime = userSelectedDate;
      }
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          body: customMessage,
          id: new Date().getTime(),
          channelId: 'growthos_alerts_v2',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#7e22ce',
          sound: 'notification_sound',
          schedule: { at: triggerTime },
          extra: { type: 'custom_alert' }
        }
      ]
    });
  } catch (e) {
    console.log("Custom notification error:", e);
  }
}