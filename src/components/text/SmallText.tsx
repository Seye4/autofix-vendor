import { Text } from "react-native";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export default function SmallText({ children, className }: Props) {
  return (
    <Text className={`text-sm ${className ?? ""}`}>
      {children}
    </Text>
  );
}