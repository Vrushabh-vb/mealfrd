declare module 'aceternity-ui' {
  import { ReactNode } from 'react';
  
  export interface ThreeDCardProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }
  
  export const ThreeDCard: React.FC<ThreeDCardProps>;
} 