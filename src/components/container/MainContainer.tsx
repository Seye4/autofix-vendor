import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  SafeAreaView,
  SafeAreaViewProps,
  Edge,
} from "react-native-safe-area-context";

import { colors } from "../colors";

interface Props extends SafeAreaViewProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
}

export default function MainContainer({
  children,
  className = "",
  style,
  edges = ["top", "bottom"],
  ...props
}: Props) {
  return (
    <SafeAreaView className={`flex-1 bg-background px-5 ${className}`}>
      {children}
    </SafeAreaView>
  );
}