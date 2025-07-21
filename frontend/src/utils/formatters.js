export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumberWithSuffix = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  const num = parseFloat(number);
  
  if (num >= 100000) {
    // Convert to lakhs (1 lakh = 100,000)
    const lakhs = (num / 100000).toFixed(1);
    return `${lakhs}L`;
  } else if (num >= 1000) {
    // Convert to thousands
    const thousands = (num / 1000).toFixed(1);
    return `${thousands}K`;
  } else {
    return num.toString();
  }
};

export const formatCurrencyWithSuffix = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  
  const num = parseFloat(amount);
  
  if (num >= 100000) {
    // Convert to lakhs (1 lakh = 100,000)
    const lakhs = (num / 100000).toFixed(1);
    return `₹${lakhs}L`;
  } else if (num >= 1000) {
    // Convert to thousands
    const thousands = (num / 1000).toFixed(1);
    return `₹${thousands}K`;
  } else {
    return `₹${num.toFixed(0)}`;
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}; 

export function formatLocation(input) {
  return decodeURIComponent(input)      // "Andaman Islands"
    .toLowerCase()                      // "andaman islands"
    .replace(/\s+/g, "-");              // "andaman-islands"
}