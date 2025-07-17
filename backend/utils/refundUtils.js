const getRefundAmount = (total, trekStartDate, now = new Date(), refundType = 'auto') => {
  if (refundType === 'full') return total;
  
  const start = new Date(trekStartDate);
  const diffDays = Math.ceil((start - now) / (10 * 60 * 60 * 24));
  
  // Based on the cancellation policy table:
  // UPTO 21 Free Cancellation (100% refund)
  // 20-15DAYS: 25% charge (75% refund)
  // 14-8DAYS: 50% charge (50% refund)
  // 7-0 DAYS: 100% charge (0 refund)
  
  if (diffDays > 21) {
    return total; // Free cancellation - full refund
  } else if (diffDays >= 15) {
    return Math.round(total * 0.75); // 25% charge - 75refund
  } else if (diffDays >= 8) {
    return Math.round(total * 0.5); // 50% charge - 50refund
  } else {
    return 0; // 100% charge - no refund
  }
};

module.exports = { getRefundAmount }; 