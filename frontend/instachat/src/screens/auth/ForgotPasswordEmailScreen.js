import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { requestForgotPasswordOtp } from "../../api/Auth.api";
import { ROUTES } from "../../navigation/routes.constants";
import colors from "../../theme/colors";

const ForgotPasswordEmailScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    try {
      setLoading(true);

      await requestForgotPasswordOtp(email.trim().toLowerCase());

      navigation.navigate(ROUTES.FORGOT_PASSWORD_OTP, {
        email: email.trim().toLowerCase(),
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSendOtp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordEmailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 6,
    marginBottom: 14,
    backgroundColor: "#FAFAFA",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
