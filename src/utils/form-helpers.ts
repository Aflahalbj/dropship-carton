
import { useCallback, useState } from 'react';

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
 * Custom hook for controlled currency input
 * @param initialValue - Initial currency value
 * @returns Object with value, handleChange, and formatted value
 */
export const useControlledCurrencyInput = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [formattedValue, setFormattedValue] = useState(formatCurrency(initialValue));
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/\D/g, '');
    setValue(numericValue);
    
    if (numericValue) {
      setFormattedValue(formatCurrency(numericValue));
    } else {
      setFormattedValue('');
    }
  }, []);
  
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue.replace(/\D/g, ''));
    setFormattedValue(formatCurrency(newValue));
  }, []);
  
  return {
    value,
    formattedValue,
    handleChange,
    updateValue,
    parsedValue: parseCurrency(value)
  };
};

/**
 * Custom hook for handling text input
 * @param initialValue - Initial text value
 * @returns Object with value and handleChange
 */
export const useControlledTextInput = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);
  
  return {
    value,
    handleChange,
    setValue
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

/**
 * Custom hook for handling form submission validation
 * @returns Object with validation state and handlers
 */
export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateForm = useCallback((fields: Record<string, any>) => {
    const { isValid, errors } = validateRequiredFields(fields);
    setErrors(errors);
    return isValid;
  }, []);
  
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  return {
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    validateForm,
    clearErrors
  };
};
