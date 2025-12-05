type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'clear' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonRounded = 'none' | 'sm' | 'md' | 'lg' | 'full';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  rounded?: ButtonRounded;
  size?: ButtonSize;
  href?: string;
  title?: string;
}

export const Button = ({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  rounded = 'full',
  size = 'md',
  href = '',
  title
}: ButtonProps) => {
  const baseClasses = `
    inline-flex 
    gap-2
    items-center 
    justify-center 
    font-medium 
    text-center 
    transition-all 
    duration-200 
    cursor-pointer
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${getSizeClasses(size, variant)}
    ${getRoundedClasses(rounded)}
  `;

  const isLink = href.length > 0;

  const Component = isLink ? 'a' : 'button';
  switch (variant) {
    case 'primary':
      return (
        <Component
          type={type}
          onClick={onClick}
          disabled={disabled}
          title={title}
          className={`${baseClasses} ${className} bg-primary text-primary-invert hover:bg-primary/80`}
          {...(isLink ? { href } : {})}
        >
          {children}
        </Component>
      );
    case 'secondary':
      return (
        <Component
          type={type}
          onClick={onClick}
          disabled={disabled}
          title={title}
          className={`${baseClasses} ${className} bg-surface hover:bg-surface-hover text-foreground`}
          {...(isLink ? { href } : {})}
        >
          {children}
        </Component>
      );
    case 'tertiary':
      return (
        <Component
          type={type}
          onClick={onClick}
          disabled={disabled}
          title={title}
          className={`${baseClasses} ${className} bg-background-light hover:bg-surface text-foreground`}
          {...(isLink ? { href } : {})}
        >
          {children}
        </Component>
      );
    case 'clear':
      return (
        <Component
          type={type}
          onClick={onClick}
          disabled={disabled}
          title={title}
          className={`${baseClasses} ${className} bg-transparent text-foreground`}
          {...(isLink ? { href } : {})}
        >
          {children}
        </Component>
      );
    case 'outline':
      return (
        <Component
          type={type}
          onClick={onClick}
          disabled={disabled}
          title={title}
          className={`${baseClasses} ${className} border border-primary text-primary hover:bg-primary/20 hover:text-primary-light`}
          {...(isLink ? { href } : {})}
        >
          {children}
        </Component>
      );
    default:
      return (
        <Component
          type={type}
          onClick={onClick}
          disabled={disabled}
          title={title}
          className={`${baseClasses} ${className} bg-primary text-foreground`}
          {...(isLink ? { href } : {})}
        >
          {children}
        </Component>
      );
  }
};

function getRoundedClasses(rounded: ButtonRounded) {
  switch (rounded) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return 'rounded-sm';
    case 'md':
      return 'rounded-md';
    case 'lg':
      return 'rounded-lg';
    case 'full':
      return 'rounded-full';
    default:
      return 'rounded-md';
  }
};



function getSizeClasses(size: ButtonSize, variant: ButtonVariant) {
  const paddingClasses = {
    'sm': 'px-3 py-1.5',
    'md': 'px-4 py-2',
    'lg': 'px-5 py-2.5',
    'xl': 'px-6 py-3',
  }

  const sizeClasses = {
    'sm': 'text-xs',
    'md': 'text-sm',
    'lg': 'text-base',
    'xl': 'text-lg',
  }

  if (variant === 'clear') {
    return sizeClasses[size];
  }

  return `${paddingClasses[size]} ${sizeClasses[size]}`;
};
