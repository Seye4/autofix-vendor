import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  View,
} from "react-native";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "outline";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export default function Button({
  title,
  variant = "primary",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  textClassName = "",
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: {
      button: "bg-primary",
      text: "text-white",
    },
    secondary: {
      button: "bg-secondary",
      text: "text-white",
    },
    danger: {
      button: "bg-danger",
      text: "text-white",
    },
    outline: {
      button: "border border-primary bg-transparent",
      text: "text-primary",
    },
  };

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      className={`
        flex-row
        items-center
        justify-center
        rounded-lg
        py-4
        px-5
        ${variantClasses[variant].button}
        ${(disabled || loading) ? "opacity-50" : ""}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#007bff" : "#fff"} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}

          <Text
            className={`font-semibold text-base ${variantClasses[variant].text} ${textClassName}`}
          >
            {title}
          </Text>

          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
}