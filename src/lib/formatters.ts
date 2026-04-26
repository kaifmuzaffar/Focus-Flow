import { Preferences } from "@/store/useStore";

export const formatDate = (date: string | Date, prefs: Preferences) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  switch (prefs.dateFormat) {
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    default: return `${day}/${month}/${year}`;
  }
};

export const formatTimeStr = (date: Date, prefs: Preferences) => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: prefs.timeFormat === '12h'
  });
};

export const formatTimeStrFromString = (timeStr: string | undefined | null, prefs: Preferences) => {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  
  if (prefs.timeFormat === '24h') {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  } else {
    const isPM = h >= 12;
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  }
};

export const formatNumber = (num: number, prefs: Preferences) => {
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, prefs.numberFormat === '1,000' ? ',' : '.');
  return parts.join(prefs.numberFormat === '1,000' ? '.' : ',');
};
