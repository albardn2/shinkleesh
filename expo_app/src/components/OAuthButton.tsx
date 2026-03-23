import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ViewStyle,
} from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { API_BASE_URL } from "../config/env";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

type Provider = "google" | "facebook" | "x";

const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google",
  facebook: "Facebook",
  x: "X",
};

const PROVIDER_COLORS: Record<Provider, string> = {
  google: "#DB4437",
  facebook: "#4267B2",
  x: "#000000",
};

interface OAuthButtonProps {
  provider: Provider;
  style?: ViewStyle;
}

export default function OAuthButton({ provider, style }: OAuthButtonProps) {
  const { loginWithToken } = useAuth();

  const redirectUri = AuthSession.makeRedirectUri();

  const handlePress = async () => {
    try {
      const authUrl = `${API_BASE_URL}/auth/oauth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const token = url.searchParams.get("token");
        const error = url.searchParams.get("error");

        if (error) {
          Alert.alert("OAuth Error", error);
          return;
        }

        if (token) {
          await loginWithToken(token);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "OAuth failed");
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: PROVIDER_COLORS[provider] },
        style,
      ]}
      onPress={handlePress}
    >
      <Text style={styles.text}>Continue with {PROVIDER_LABELS[provider]}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
