import React from 'react';
import { ButtonGroupItem } from './ButtonGroupItem';

export { ButtonGroupItem };

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup = ({ children, className = '' }: ButtonGroupProps) => {
  const childArray = React.Children.toArray(children);

  return (
    <div className={`inline-flex rounded-lg overflow-hidden border border-border ${className}`}>
      {childArray.map((child, index) => {
        const isFirst = index === 0;
        const isLast = index === childArray.length - 1;

        let position: 'first' | 'middle' | 'last' = 'middle';
        if (isFirst) position = 'first';
        else if (isLast) position = 'last';

        return (
          <ButtonGroupItem key={index} position={position}>
            {child}
          </ButtonGroupItem>
        );
      })}
    </div>
  );
};