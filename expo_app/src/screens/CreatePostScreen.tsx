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
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createPost } from "../services/posts";
import { useLocation } from "../hooks/useLocation";

type Props = NativeStackScreenProps<{ CreatePost: undefined }, "CreatePost">;

const MAX_LENGTH = 500;

export default function CreatePostScreen({ navigation }: Props) {
  const { location } = useLocation();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Post cannot be empty");
      return;
    }
    if (!location) {
      Alert.alert("Error", "Location not available");
      return;
    }

    setLoading(true);
    try {
      await createPost(message.trim(), location.lat, location.lng);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !message.trim()}
        >
          <Text
            style={[
              styles.post,
              (!message.trim() || loading) && styles.postDisabled,
            ]}
          >
            {loading ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#999"
        multiline
        maxLength={MAX_LENGTH}
        value={message}
        onChangeText={setMessage}
        autoFocus
      />

      <Text style={styles.charCount}>
        {message.length}/{MAX_LENGTH}
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cancel: {
    fontSize: 16,
    color: "#666",
  },
  post: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6C63FF",
  },
  postDisabled: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 13,
    color: "#999",
  },
});
