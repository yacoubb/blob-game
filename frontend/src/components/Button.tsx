/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

// TODO add disabled tooltip to button? or create separate component for tooling the tips
export type ButtonColor = 'blue' | 'red' | 'green';
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: ButtonColor;
};

type ButtonConfig = {
  bg: string;
  bgHover?: string;
  bgDisabled?: string;
  text: string;
  textHover?: string;
  textDisabled?: string;
};

const buttonThemes: Record<ButtonColor, ButtonConfig> = {
  blue: {
    bg: 'bg-blue-500',
    bgHover: 'hover:bg-blue-700',
    text: 'text-white',
  },
  red: {
    bg: 'bg-red-500',
    bgHover: 'hover:bg-red-700',
    text: 'text-white',
  },
  green: {
    bg: 'bg-green-500',
    bgHover: 'hover:bg-green-700',
    text: 'text-white',
  },
};

const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  color,
  className,
  ...buttonProps
}) => {
  const extraClassNames = React.useMemo(() => {
    let classNameList = Object.values(buttonThemes[color ?? 'blue']);
    if (buttonProps.disabled) {
      classNameList.push('opacity-75');
      classNameList = classNameList.filter((cn) => !cn.includes('hover'));
    }
    return classNameList;
  }, [buttonProps.disabled, color]);
  return (
    <button
      type="button"
      {...buttonProps}
      className={`${extraClassNames.join(
        ' ',
      )} ${className} font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
