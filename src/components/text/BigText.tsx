import { Text } from "react-native";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export default function BigText({ children, className }: Props) {
  return (
    <Text className={`text-2xl text-dark ${className ?? ""}`}>
      {children}
    </Text>
  );
}