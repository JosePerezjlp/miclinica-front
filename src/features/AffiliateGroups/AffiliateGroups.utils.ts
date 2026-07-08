const clampChargeDay = (year: number, month: number, chargeDay: number) => {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(chargeDay, 1), lastDayOfMonth);
};

export const calculateNextChargeDate = (chargeDay: number, now = new Date()) => {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthDay = clampChargeDay(currentYear, currentMonth, chargeDay);
  const currentCandidate = new Date(currentYear, currentMonth, currentMonthDay);

  if (currentCandidate.getTime() > now.getTime()) {
    return currentCandidate;
  }

  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthDay = clampChargeDay(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
    chargeDay,
  );

  return new Date(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
    nextMonthDay,
  );
};
