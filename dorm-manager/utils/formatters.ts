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

export const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

export default {
  formatCurrency,
  formatPrice,
  formatPriceWithDecimals,
  formatDateTime,
};
