import { ReactNode } from 'react';

declare module 'react-tippy' {
  export interface TooltipProps {
    children: ReactNode;
    title: string;
    trigger?: string;
    placement?: string;
    [key: string]: any;
  }
}
