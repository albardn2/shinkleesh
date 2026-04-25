import React from "react";
import { Alert, Platform, StyleSheet, ViewStyle } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { useAuth } from "../context/AuthContext";

interface AppleSignInButtonProps {
  style?: ViewStyle;
}

export default function AppleSignInButton({ style }: AppleSignInButtonProps) {
  const { loginWithToken } = useAuth();

  if (Platform.OS !== "ios") {
    return null;
  }

  const handlePress = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert("Apple Sign-In", "No identity token returned by Apple.");
        return;
      }

      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(" ")
            .trim() || null
        : null;

      const response = await axios.post(`${API_BASE_URL}/auth/oauth/apple/native`, {
        identity_token: credential.identityToken,
        full_name: fullName,
      });

      const token = response.data?.access_token;
      if (!token) {
        Alert.alert("Apple Sign-In", "Server did not return an access token.");
        return;
      }

      await loginWithToken(token);
    } catch (err: any) {
      if (err?.code === "ERR_REQUEST_CANCELED") {
        return;
      }
      const message =
        err?.response?.data?.error || err?.message || "Apple Sign-In failed";
      Alert.alert("Apple Sign-In", message);
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={10}
      style={[styles.button, style]}
      onPress={handlePress}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 48,
    marginBottom: 10,
  },
});
