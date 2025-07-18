// Test script to verify payment amount calculation
// This simulates the exact calculation flow from the frontend

function calculateBasePrice(batchPrice, numberOfParticipants, addOns = []) {
  let basePrice = batchPrice * numberOfParticipants;
  addOns.forEach(addOn => {
    if (addOn.isEnabled) {
      basePrice += addOn.price * numberOfParticipants;
    }
  });
  return basePrice;
}

function calculateDiscountedPrice(basePrice, appliedCoupon = null) {
  if (!appliedCoupon || !appliedCoupon.promoCode) return basePrice;
  const { discountType, discountValue } = appliedCoupon.promoCode;
  if (discountType === 'percentage') {
    return basePrice * (1 - discountValue / 100);
  } else if (discountType === 'fixed') {
    return Math.max(0, basePrice - discountValue);
  }
  return basePrice;
}

function calculateTotalPrice(basePrice, discountedPrice, taxInfo) {
  const gstAmount = discountedPrice * (taxInfo.gstPercent / 100);
  const gatewayCharges = discountedPrice * (taxInfo.gatewayPercent / 100);
  return discountedPrice + gstAmount + gatewayCharges;
}

// Test case 1: Basic calculation (no add-ons, no coupons)
console.log('=== Test Case 1: Basic Calculation ===');
const batchPrice = 50;
const numberOfParticipants = 1;
const taxInfo = { gstPercent: 5, gatewayPercent: 2 };

const basePrice1 = calculateBasePrice(batchPrice, numberOfParticipants);
const discountedPrice1 = calculateDiscountedPrice(basePrice1);
const totalPrice1 = calculateTotalPrice(basePrice1, discountedPrice1, taxInfo);

console.log(`Base Price: ₹${basePrice1}`);
console.log(`Discounted Price: ₹${discountedPrice1}`);
console.log(`GST (${taxInfo.gstPercent}%): ₹${(discountedPrice1 * (taxInfo.gstPercent / 100)).toFixed(2)}`);
console.log(`Gateway Charges (${taxInfo.gatewayPercent}%): ₹${(discountedPrice1 * (taxInfo.gatewayPercent / 100)).toFixed(2)}`);
console.log(`Total Price: ₹${totalPrice1.toFixed(2)}`);

// Test what happens with Math.round
console.log(`\nWith Math.round: ₹${Math.round(totalPrice1)}`);
console.log(`Difference: ₹${Math.round(totalPrice1) - totalPrice1}`);

// Test Razorpay conversion
console.log(`\nRazorpay amount (paisa): ${Math.round(totalPrice1 * 100)}`);
console.log(`Razorpay amount (rupees): ₹${Math.round(totalPrice1 * 100) / 100}`);

// Test case 2: With add-ons
console.log('\n=== Test Case 2: With Add-ons ===');
const addOns = [
  { name: 'Room', price: 100, isEnabled: true }
];

const basePrice2 = calculateBasePrice(batchPrice, numberOfParticipants, addOns);
const discountedPrice2 = calculateDiscountedPrice(basePrice2);
const totalPrice2 = calculateTotalPrice(basePrice2, discountedPrice2, taxInfo);

console.log(`Base Price (with add-ons): ₹${basePrice2}`);
console.log(`Discounted Price: ₹${discountedPrice2}`);
console.log(`GST (${taxInfo.gstPercent}%): ₹${(discountedPrice2 * (taxInfo.gstPercent / 100)).toFixed(2)}`);
console.log(`Gateway Charges (${taxInfo.gatewayPercent}%): ₹${(discountedPrice2 * (taxInfo.gatewayPercent / 100)).toFixed(2)}`);
console.log(`Total Price: ₹${totalPrice2.toFixed(2)}`);

// Test case 3: With coupon discount
console.log('\n=== Test Case 3: With Coupon Discount ===');
const appliedCoupon = {
  promoCode: {
    discountType: 'percentage',
    discountValue: 10
  }
};

const basePrice3 = calculateBasePrice(batchPrice, numberOfParticipants, addOns);
const discountedPrice3 = calculateDiscountedPrice(basePrice3, appliedCoupon);
const totalPrice3 = calculateTotalPrice(basePrice3, discountedPrice3, taxInfo);

console.log(`Base Price: ₹${basePrice3}`);
console.log(`Discounted Price (after 10% off): ₹${discountedPrice3.toFixed(2)}`);
console.log(`GST (${taxInfo.gstPercent}%): ₹${(discountedPrice3 * (taxInfo.gstPercent / 100)).toFixed(2)}`);
console.log(`Gateway Charges (${taxInfo.gatewayPercent}%): ₹${(discountedPrice3 * (taxInfo.gatewayPercent / 100)).toFixed(2)}`);
console.log(`Total Price: ₹${totalPrice3.toFixed(2)}`);

console.log('\n=== Summary ===');
console.log('The issue was that Math.round() was being applied to the total price before sending to Razorpay.');
console.log('This caused ₹53.50 to become ₹54, creating a discrepancy.');
console.log('The fix removes Math.round() from the payment flow while keeping it for display purposes.'); 