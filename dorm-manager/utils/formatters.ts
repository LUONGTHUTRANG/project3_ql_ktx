export const formatCurrency = (value: number | string | undefined, decimals: number = 0): string => {
  if (value === undefined || value === null) return '0';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';

  // Format with specified decimals
  const parts = num.toFixed(decimals).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add dots as thousand separators for integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Return with or without decimal places
  if (decimals > 0 && decimalPart) {
    return `${formattedInteger},${decimalPart}`;
  }

  return formattedInteger;
};

export const formatPrice = (value: number | string | undefined): string => {
  return `${formatCurrency(value, 0)} đ`;
};

export const formatPriceWithDecimals = (value: number | string | undefined, decimals: number = 2): string => {
  return `${formatCurrency(value, decimals)} đ`;
};

export default {
  formatCurrency,
  formatPrice,
  formatPriceWithDecimals,
};
