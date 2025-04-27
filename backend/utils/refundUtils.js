const getRefundAmount = (total, trekStartDate, now = new Date(), refundType = 'auto') => {
  if (refundType === 'full') return total;
  const start = new Date(trekStartDate);
  const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
  if (diffDays > 7) return Math.round(total * 0.9); // >7 days: 90%
  if (diffDays >= 3) return Math.round(total * 0.5); // 3-7 days: 50%
  return 0; // <3 days: no refund
};

module.exports = { getRefundAmount }; 