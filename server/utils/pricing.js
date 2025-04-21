
// Pricing configuration
const BASE_RATE = 40; // Base rate in ₹ for 4 hours
const BASE_HOURS = 4; // Base time period in hours
const GRACE_PERIOD_MINUTES = 10; // Grace period in minutes

// Fine rates
const FINE_RATE_1 = 5; // ₹ per 10 minutes for first 30 minutes after base period
const FINE_RATE_2 = 10; // ₹ per 10 minutes after first 30 minutes beyond base period

/**
 * Calculate parking fee based on entry and exit time
 * @param {Date} entryTime - Entry timestamp
 * @param {Date} exitTime - Exit timestamp
 * @returns {Object} - Fee details
 */
const calculateFee = (entryTime, exitTime) => {
  console.log(`Calculating fee for entry: ${entryTime}, exit: ${exitTime}`);
  
  // Calculate total minutes
  const entryTimeMs = new Date(entryTime).getTime();
  const exitTimeMs = new Date(exitTime).getTime();
  const durationMs = exitTimeMs - entryTimeMs;
  const totalMinutes = Math.ceil(durationMs / (1000 * 60));
  
  console.log(`Total duration: ${totalMinutes} minutes`);
  
  // Base period in minutes
  const baseMinutes = BASE_HOURS * 60;
  
  // Check if within base period (including grace period)
  if (totalMinutes <= baseMinutes + GRACE_PERIOD_MINUTES) {
    return {
      baseAmount: BASE_RATE,
      fineAmount: 0,
      totalAmount: BASE_RATE,
      durationMinutes: totalMinutes,
      overageMinutes: 0
    };
  }
  
  // Calculate overage minutes (beyond base period and grace period)
  const overageMinutes = totalMinutes - baseMinutes - GRACE_PERIOD_MINUTES;
  console.log(`Overage minutes: ${overageMinutes}`);
  
  // Calculate fine
  let fineAmount = 0;
  
  // First 30 minutes after base period
  if (overageMinutes <= 30) {
    // Round up to nearest 10-minute interval and apply rate
    const intervals = Math.ceil(overageMinutes / 10);
    fineAmount = intervals * FINE_RATE_1;
  } else {
    // First 30 minutes at rate 1
    fineAmount = 3 * FINE_RATE_1;
    
    // Remaining time at rate 2
    const remainingMinutes = overageMinutes - 30;
    const intervals = Math.ceil(remainingMinutes / 10);
    fineAmount += intervals * FINE_RATE_2;
  }
  
  const totalAmount = BASE_RATE + fineAmount;
  
  console.log(`Fee calculation: Base: ₹${BASE_RATE}, Fine: ₹${fineAmount}, Total: ₹${totalAmount}`);
  
  return {
    baseAmount: BASE_RATE,
    fineAmount,
    totalAmount,
    durationMinutes: totalMinutes,
    overageMinutes
  };
};

module.exports = {
  calculateFee,
  BASE_RATE,
  BASE_HOURS
};
