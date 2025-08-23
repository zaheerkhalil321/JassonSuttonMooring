import { format, parseISO, isValid } from 'date-fns';

const useSavedTime = () => {
  const parseTime = (utcDateString: string | null) => {
    if (!utcDateString || !Object.keys(utcDateString).length) return null;

    // Remove Z suffix and any timezone info to treat as local time
    const dateWithoutZ = utcDateString.replace(/Z|[+-]\d{2}:\d{2}$/g, '');
    
    // If it's just a time string (HH:mm:ss), create a date object for today
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(dateWithoutZ)) {
      const today = new Date();
      const [hours, minutes, seconds = '00'] = dateWithoutZ.split(':');
      today.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
      return today;
    }
    
    const parsedDate = parseISO(dateWithoutZ);
    return isValid(parsedDate) ? parsedDate : null;
  };

  const formatTime = (
    utcDateString: string | null, 
    formatString: string = 'HH:mm',
    fallback: string = '--'
  ) => {
    if (!utcDateString || !Object.keys(utcDateString).length) return fallback;

    const localDate = parseTime(utcDateString);
    if (!localDate) return fallback;

    // Simply format the time - no special case handling needed
    return format(localDate, formatString);
  };

  const formatDate = (utcDateString: string | null, formatString: string = 'MMM dd, yyyy') => {
    if (!utcDateString) return '--';
    
    const localDate = parseTime(utcDateString);
    return localDate ? format(localDate, formatString) : '--';
  };

  return { parseTime, formatTime, formatDate };
};

export default useSavedTime;