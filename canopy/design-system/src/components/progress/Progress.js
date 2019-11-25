import React from 'react';
export default function Progress({
  max,
  value,
  children,
  className,
  ...props
}) {
  return (
    <progress
      className={`progress${className ? ` ${className}` : ''}`}
      max={max}
      value={value}
      {...props}
    >
      {children && children}
    </progress>
  );
}
