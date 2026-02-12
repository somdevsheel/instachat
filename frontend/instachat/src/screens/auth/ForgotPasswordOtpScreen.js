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

import { verifyForgotPasswordOtp } from "../../api/Auth.api";
import { ROUTES } from "../../navigation/routes.constants";
import colors from "../../theme/colors";

const ForgotPasswordOtpScreen = ({ route, navigation }) => {
  const { email } = route.params;

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert("Error", "OTP and password required");
      return;
    }

    try {
      setLoading(true);

      await verifyForgotPasswordOtp({
        email,
        otp: otp.trim(),
        newPassword,
      });

      Alert.alert(
        "Success",
        "Password reset successfully. Please login.",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: ROUTES.LOGIN }],
              }),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>{email}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <TextInput
        style={styles.input}
        placeholder="New password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordOtpScreen;

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
    marginBottom: 6,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
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
