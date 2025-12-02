export function getDateRange(dateString: string) {
  const date = new Date(dateString);
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const endOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  );
  return {
    gte: startOfDay,
    lt: endOfDay,
  };
}
