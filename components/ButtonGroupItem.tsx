import React from 'react';

interface ButtonGroupItemProps {
  children: React.ReactNode;
  className?: string;
  position?: 'first' | 'middle' | 'last';
}

export const ButtonGroupItem = ({
  children,
  className = '',
  position = 'middle'
}: ButtonGroupItemProps) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'first':
        return 'rounded-l-lg rounded-r-none';
      case 'last':
        return 'rounded-r-lg rounded-l-none border-l-0';
      case 'middle':
      default:
        return 'rounded-none border-l-0';
    }
  };

  if (!React.isValidElement(children)) {
    return <>{children}</>;
  }

  return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
    className: `${(children.props as { className?: string }).className || ''} ${getPositionClasses()} ${className}`.trim(),
  });
};