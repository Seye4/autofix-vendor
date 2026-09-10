import { Text, View, StyleSheet, Pressable } from 'react-native';
import MainContainer from './container/MainContainer';
import Button from './button/Button';
import SmallText from './text/SmallText';
import RegularText from './text/RegularText';
import BigText from './text/BigText';
import StyledTextInput from './input/StyledTextInput';
import { useState } from 'react';
import { LogIn, Search } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export default function Index() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    setEmailError('');

    // Continue submitting...
  };

  const handleLogin = () => {
    console.log('Logging in...');
    // Your login logic goes here
  };

  return (
    <MainContainer className="px-6 pt-8">
      <BigText>Create Account</BigText>
      <SmallText>Edit src/app/index.tsx to edit this screen.</SmallText>
      <RegularText>Changes you make will automatically reload.</RegularText>
      <StyledTextInput
        // label="Email"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        className="bg-white"
        // isError={email.length > 0 && !email.includes("@")}
        isPassword={false}
      />
      <StyledTextInput label="Email" placeholder="Enter your email" />

      <StyledTextInput label="Password" placeholder="Password" isPassword />

      {/* <StyledTextInput
  label="Email"
  value={email}
  onChangeText={(text) => {
    setEmail(text);
    setEmailError("");
  }}
  keyboardType="email-address"
  autoCapitalize="none"
  error={emailError}
/> */}

      <StyledTextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        {...(emailError && { error: emailError })}
      />

      <StyledTextInput label="Password" placeholder="Enter your password" isPassword />

      <StyledTextInput
        label="Search"
        placeholder="Search..."
        leftIcon={(focused) => <Search size={20} color={focused ? '#007bff' : '#9ca3af'} />}
      />

      <Button title="Sign In" onPress={handleLogin} />

      <Button title="Sign In" leftIcon={<LogIn size={18} color="white" />} />

      <Button
        title="Cancel"
        variant="secondary"
        // onPress={handleCancel}
      />

      <Button
        title="Delete"
        variant="danger"
        // onPress={handleDelete}
      />

      <Button title="Learn More" variant="outline" />

      <Button title="Signing In..." loading />
    </MainContainer>
  );
}
