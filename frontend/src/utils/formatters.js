export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
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