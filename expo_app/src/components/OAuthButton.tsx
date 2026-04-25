import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Alert,
  ViewStyle,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { API_BASE_URL } from "../config/env";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

type Provider = "google";

const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google",
};

const PROVIDER_ICONS: Record<Provider, { name: React.ComponentProps<typeof FontAwesome>["name"]; color: string }> = {
  google: { name: "google", color: "#DB4437" },
};

const BORDER_COLOR = "#2A2A2A";
const SURFACE = "#141414";
const TEXT_COLOR = "#F5F5F5";

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
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <FontAwesome
          name={PROVIDER_ICONS[provider].name}
          size={16}
          color={PROVIDER_ICONS[provider].color}
          style={styles.icon}
        />
        <Text style={styles.text}>Continue with {PROVIDER_LABELS[provider]}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
    width: 18,
    textAlign: "center",
  },
  text: {
    color: TEXT_COLOR,
    fontSize: 14,
    fontWeight: "500",
  },
});
