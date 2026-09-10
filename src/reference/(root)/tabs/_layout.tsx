import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

const useNativeTabs = Platform.OS === 'ios';

export default function TabLayout() {
  /* if (useNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf="house.fill" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <Icon sf="person.fill" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  } */
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" drawable="custom_settings_drawable" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
