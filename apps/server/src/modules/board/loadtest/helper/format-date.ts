export const formatDate = (date: Date) => `${date.toISOString().slice(0, 10)} ${date.toLocaleTimeString('de-DE')}`;
