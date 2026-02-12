import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useDispatch } from "react-redux";
import { ROUTES } from "../../navigation/routes.constants";
import colors from "../../theme/colors";
import { requestRegisterOtp } from "../../api/Auth.api";


const SignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendOtp = async () => {
  if (!fullName || !username || !email) {
    Alert.alert("Missing details", "Please fill all fields");
    return;
  }

  try {
    setSubmitting(true);

    // await requestRegisterOtp({
    //   email: email.trim().toLowerCase(),
    // });
    await requestRegisterOtp(email.trim().toLowerCase());


    navigation.navigate(ROUTES.SIGNUP_OTP, {
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
    });
  } catch (error) {
    Alert.alert(
      "Error",
      error?.response?.data?.message || "Failed to send OTP"
    );
  } finally {
    setSubmitting(false);
  }
};


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity
          style={[
            styles.button,
            submitting && styles.buttonDisabled,
          ]}
          onPress={handleSendOtp}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate(ROUTES.LOGIN)}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginHighlight}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
    color: "#000",
  },

  input: {
    width: "100%",
    padding: 14,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 6,
    marginBottom: 14,
    fontSize: 16,
  },

  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  loginLink: {
    marginTop: 24,
    alignItems: "center",
  },

  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  loginHighlight: {
    color: colors.primary,
    fontWeight: "600",
  },
});
