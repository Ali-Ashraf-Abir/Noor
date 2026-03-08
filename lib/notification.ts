// lib/notifications.ts
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
}

export function schedulePrayerNotifications(
  times: Record<string, string>,
  minutesBefore = 10
) {
  const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const now = new Date();

  prayerOrder.forEach((prayer) => {
    const [h, m] = times[prayer].split(':').map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(h, m - minutesBefore, 0, 0);

    const delay = prayerDate.getTime() - now.getTime();
    if (delay > 0) {
      setTimeout(() => {
        new Notification(`🕌 ${prayer} in ${minutesBefore} minutes`, {
          body: `Prayer time at ${times[prayer]}`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
        });
      }, delay);
    }
  });
}