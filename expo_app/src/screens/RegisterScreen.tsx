import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<{ Login: undefined; Register: undefined }, "Register">;

const PRIMARY = "#52FFB8";
const BG = "#0A0A0A";
const SURFACE = "#141414";
const BORDER = "#2A2A2A";
const TEXT_PRIMARY = "#F5F5F5";
const TEXT_SECONDARY = "#737373";
const TEXT_MUTED = "#525252";

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Error", "Username and password are required");
      return;
    }
    setLoading(true);
    try {
      await register({
        username: username.trim(),
        password,
        phone_number: phone.trim() || undefined,
      });
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Shinkleesh</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username *"
            placeholderTextColor={TEXT_MUTED}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone number"
            placeholderTextColor={TEXT_MUTED}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Password *"
            placeholderTextColor={TEXT_MUTED}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "Creating account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  form: {
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: SURFACE,
    color: TEXT_PRIMARY,
  },
  registerButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: BG,
    fontSize: 15,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 32,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  loginBold: {
    color: PRIMARY,
    fontWeight: "600",
  },
});
