import { useState } from "react";
import { View, Text, TextInput, TextInputProps, Pressable } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  className?: string;

  leftIcon?: (focused: boolean) => React.ReactNode;
  rightIcon?: (focused: boolean) => React.ReactNode;
}

export default function StyledTextInput({
  label,
  error,
  isPassword = false,
  className = "",
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus: TextInputProps["onFocus"] = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps["onBlur"] = (e) => {
    setFocused(false);
    onBlur?.(e);
  };


  return (
    <View className="gap-2">
      {label && (
        <Text className="text-sm font-medium text-gray-700">
          {label}
        </Text>
      )}

      <View
        className={`
          flex-row
          items-center
          border
          rounded-md
          bg-white
          px-3
          ${focused ? "border-blue-500" : "border-gray-300"}
          ${error ? "border-red-500" : ""}
        `}
      >
        {leftIcon && (
          <View className="mr-2">
            {leftIcon(focused)}
          </View>
        )}

        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            flex-1
            py-3
            text-black
            ${className}
          `}
        />

        {/* {rightIcon && (
          <View className="ml-2">
            {rightIcon(focused)}
          </View>
        )} */}

        {isPassword ? (
  <Pressable
    onPress={() => setShowPassword((prev) => !prev)}
    className="ml-2"
    hitSlop={10}
  >
    {showPassword ? (
      <EyeOff size={20} color="#6b7280" />
    ) : (
      <Eye size={20} color="#6b7280" />
    )}
  </Pressable>
) : (
  rightIcon && (
    <View className="ml-2">
      {rightIcon(focused)}
    </View>
  )
)}
      </View>

      {error && (
        <Text className="text-sm text-red-500">
          {error}
        </Text>
      )}
    </View>
  );
}