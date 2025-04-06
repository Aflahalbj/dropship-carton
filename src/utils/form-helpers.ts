
import { useCallback } from 'react';

/**
 * Utility to format currency input with thousand separators
 * @param value - The input value to format
 * @returns Formatted string with thousand separators
 */
export const formatCurrency = (value: string): string => {
  // Remove non-digit characters
  const numericValue = value.replace(/\D/g, '');
  
  // Format with thousand separators
  if (numericValue === '') return '';
  
  const formattedValue = new Intl.NumberFormat('id-ID').format(
    parseInt(numericValue, 10)
  );
  
  return formattedValue;
};

/**
 * Utility to parse currency input from formatted string
 * @param value - The formatted input value
 * @returns Number value
 */
export const parseCurrency = (value: string): number => {
  // Remove non-digit characters and convert to number
  const numericValue = value.replace(/\D/g, '');
  return numericValue ? parseInt(numericValue, 10) : 0;
};

/**
 * Custom hook for handling currency input
 * @param initialValue - Initial currency value
 * @param onChange - Callback function when value changes
 * @returns Object with value, handleChange, and formatted value
 */
export const useCurrencyInput = (
  initialValue: string = '',
  onChange?: (value: string) => void
) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrency(e.target.value);
    if (onChange) {
      onChange(formattedValue);
    }
  }, [onChange]);
  
  return {
    handleChange,
    formatCurrency
  };
};

/**
 * Utility function to validate required fields
 * @param fields - Object containing field names and values
 * @returns Object with validation result and error messages
 */
export const validateRequiredFields = (fields: Record<string, any>) => {
  const errors: Record<string, string> = {};
  let isValid = true;
  
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      errors[key] = `Bidang ${key} wajib diisi`;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};
