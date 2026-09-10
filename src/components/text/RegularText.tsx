import { Text } from "react-native";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export default function RegularText({ children, className }: Props) {
  return (
    <Text className={`text-base text-fuchsia-500 ${className ?? ""}`}>
      {children}
    </Text>
  );
}