<div className="text-2xl font-bold">
  ₹{totalRevenue.toLocaleString('en-IN')}
</div>

const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN')}`;
}; 