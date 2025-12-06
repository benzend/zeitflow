import { ReactNode } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  icon
}: DropdownProps) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          bg-background-extra-light
          border-background
          border-1
          rounded-[8px] 
          h-full 
          w-full 
          px-[12px] 
          ${icon ? 'pl-[36px]' : ''}
          text-[12px] 
          text-foreground 
          outline-none 
          cursor-pointer
          transition-colors
          hover:border-[#6a6a6a]
          focus:border-primary
          disabled:opacity-50 
          disabled:cursor-not-allowed
          appearance-none
          bg-[url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")]
          bg-[length:16px_16px]
          bg-[right_8px_center]
          bg-no-repeat
          pr-[32px]
        `}
      >
        {placeholder && !value && (
          <option value="" disabled className="bg-[#484848] text-[#999]">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#484848] text-white hover:bg-[#535353]"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
