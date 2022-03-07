import React from 'react';

const PaddedContainer: React.FC<React.HTMLProps<HTMLDivElement>> = ({
  children,
  className,
  ...divProps
}) => {
  return (
    <div
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...divProps}
      className={`${
        className ?? ''
      } container box-border py-4 px-4 mx-auto h-screen`}
    >
      {children}
    </div>
  );
};

export default PaddedContainer;
