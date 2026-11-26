import RadioGroup from "./RadioGroup";

export type BooleanFieldProps = {
  label?: string;
  value?: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
  direction?: "horizontal" | "vertical";
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function BooleanField({
    label,
    value,
    yesLabel,
    noLabel,
    onChange,
    direction = "horizontal",
    helperText,
    error,
    required = false,
    disabled = false,
    className = ""
}: BooleanFieldProps) {
  return (
      <RadioGroup<boolean>
          label={label}
          value={value}
          options={[
            {
              label: yesLabel,
              value: true,
            },
            {
              label: noLabel,
              value: false,
            },
          ]}
          onChange={onChange}
          direction={direction}
          helperText={helperText}
          error={error}
          required={required}
          disabled={disabled}
          className={className}
      />
  );
}
