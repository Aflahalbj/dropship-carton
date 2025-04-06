
import React from 'react';
import { Input } from "@/components/ui/input";
import { useControlledCurrencyInput, useControlledTextInput } from '@/utils/form-helpers';

interface CurrencyInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  onChange?: (value: number) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  label,
  placeholder = "0",
  initialValue = '',
  className = '',
  disabled = false,
  error,
  onChange
}) => {
  const { formattedValue, handleChange, parsedValue } = useControlledCurrencyInput(initialValue);
  
  // Only trigger onChange when input is complete (on blur)
  const handleBlur = () => {
    if (onChange) {
      onChange(parsedValue);
    }
  };
  
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor={id}>{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">Rp</span>
        <Input
          id={id}
          type="text"
          value={formattedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="pl-8"
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
};

interface TextInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  onChange?: (value: string) => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  placeholder = '',
  initialValue = '',
  className = '',
  disabled = false,
  error,
  onChange
}) => {
  const { value, handleChange } = useControlledTextInput(initialValue);
  
  // Only trigger onChange when input is complete (on blur)
  const handleBlur = () => {
    if (onChange) {
      onChange(value);
    }
  };
  
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor={id}>{label}</label>}
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
};
