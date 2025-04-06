
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

// Enhanced debounced form control with proper state management
interface DebouncedFormControlProps {
  debounceTime?: number;
  onChangeComplete?: (value: any) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  defaultValue?: string | number;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  [key: string]: any;
}

const DebouncedFormControl = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  DebouncedFormControlProps
>(({ debounceTime = 500, onChange, onChangeComplete, defaultValue = '', children, ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const [internalValue, setInternalValue] = React.useState<any>(defaultValue);
  
  // Create a ref for the input/textarea element
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  
  // Combine refs
  const handleRef = (element: HTMLInputElement | HTMLTextAreaElement | null) => {
    inputRef.current = element;
    
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = element;
    }
  };
  
  // Use debounce for onChange events
  const debouncedOnChange = React.useMemo(() => {
    if (!onChange && !onChangeComplete) return undefined;
    
    let timeout: NodeJS.Timeout;
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      clearTimeout(timeout);
      const newValue = e.target.value;
      
      // Update internal value immediately
      setInternalValue(newValue);
      
      // Call onChange immediately if present (for UI updates)
      if (onChange) {
        onChange(e);
      }
      
      // Debounce the onChangeComplete callback
      if (onChangeComplete) {
        timeout = setTimeout(() => {
          onChangeComplete(newValue);
        }, debounceTime);
      }
    };
  }, [onChange, onChangeComplete, debounceTime]);
  
  return (
    <Slot
      ref={handleRef}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      onChange={debouncedOnChange}
      {...props}
    >
      {React.isValidElement(children) 
        ? React.cloneElement(children, {
            value: internalValue,
            onChange: debouncedOnChange
          } as any)
        : children}
    </Slot>
  );
});
DebouncedFormControl.displayName = "DebouncedFormControl"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  DebouncedFormControl,
}
