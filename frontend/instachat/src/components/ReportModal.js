import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { submitReport } from "../api/report.api";

/**
 * ======================================================
 * REPORT REASONS
 * ======================================================
 */
const REPORT_REASONS = [
  { key: "spam", label: "Spam", icon: "alert-circle-outline" },
  { key: "harassment", label: "Harassment or Bullying", icon: "hand-left-outline" },
  { key: "hate_speech", label: "Hate Speech", icon: "megaphone-outline" },
  { key: "violence", label: "Violence or Threats", icon: "warning-outline" },
  { key: "nudity", label: "Nudity or Sexual Content", icon: "eye-off-outline" },
  { key: "false_information", label: "False Information", icon: "newspaper-outline" },
  { key: "scam", label: "Scam or Fraud", icon: "shield-outline" },
  { key: "intellectual_property", label: "Intellectual Property", icon: "document-outline" },
  { key: "self_harm", label: "Self-Harm", icon: "heart-outline" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

/**
 * ======================================================
 * REPORT MODAL COMPONENT
 * ======================================================
 *
 * Usage:
 *
 *   <ReportModal
 *     visible={showReport}
 *     onClose={() => setShowReport(false)}
 *     targetType="post"        // 'post' | 'reel' | 'story' | 'comment' | 'user'
 *     targetId={post._id}
 *   />
 */
export default function ReportModal({ visible, onClose, targetType, targetId }) {
  const [step, setStep] = useState("reason"); // 'reason' | 'details' | 'submitting' | 'done'
  const [selectedReason, setSelectedReason] = useState(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setStep("reason");
    setSelectedReason(null);
    setDescription("");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSelectReason = useCallback((reason) => {
    setSelectedReason(reason);
    setStep("details");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedReason || !targetId || !targetType) return;

    setStep("submitting");
    setError(null);

    try {
      await submitReport({
        targetType,
        targetId,
        reason: selectedReason,
        description: description.trim(),
      });
      setStep("done");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to submit report";
      setError(msg);
      setStep("details");
      Alert.alert("Report Failed", msg);
    }
  }, [selectedReason, targetId, targetType, description]);

  const getTypeLabel = () => {
    switch (targetType) {
      case "post": return "post";
      case "reel": return "reel";
      case "story": return "story";
      case "comment": return "comment";
      case "user": return "account";
      default: return "content";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* ====== STEP 1: SELECT REASON ====== */}
          {step === "reason" && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Report {getTypeLabel()}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#888" />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Why are you reporting this {getTypeLabel()}?
              </Text>

              <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.key}
                    style={styles.reasonItem}
                    onPress={() => handleSelectReason(reason.key)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name={reason.icon} size={20} color="#aaa" />
                    <Text style={styles.reasonText}>{reason.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#555" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* ====== STEP 2: ADD DETAILS ====== */}
          {step === "details" && (
            <>
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => setStep("reason")}
                  style={styles.backBtn}
                >
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Add Details</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#888" />
                </TouchableOpacity>
              </View>

              <View style={styles.selectedReasonBadge}>
                <Text style={styles.selectedReasonText}>
                  {REPORT_REASONS.find((r) => r.key === selectedReason)?.label}
                </Text>
              </View>

              <Text style={styles.subtitle}>
                Provide additional details (optional)
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="Describe what happened..."
                placeholderTextColor="#555"
                multiline
                maxLength={1000}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />

              <Text style={styles.charCount}>{description.length}/1000</Text>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                activeOpacity={0.7}
              >
                <Text style={styles.submitBtnText}>Submit Report</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ====== STEP 3: SUBMITTING ====== */}
          {step === "submitting" && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#0095f6" />
              <Text style={styles.loadingText}>Submitting report...</Text>
            </View>
          )}

          {/* ====== STEP 4: DONE ====== */}
          {step === "done" && (
            <View style={styles.centerContent}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={56} color="#2ecc71" />
              </View>
              <Text style={styles.doneTitle}>Report Submitted</Text>
              <Text style={styles.doneSubtitle}>
                Thank you for reporting. Our team will review this{" "}
                {getTypeLabel()} and take appropriate action.
              </Text>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 34,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2e2e2e",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  closeBtn: {
    padding: 4,
  },
  backBtn: {
    padding: 4,
  },
  subtitle: {
    color: "#888",
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  reasonsList: {
    maxHeight: 400,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2e2e2e",
    gap: 12,
  },
  reasonText: {
    color: "#eee",
    fontSize: 15,
    flex: 1,
  },
  selectedReasonBadge: {
    backgroundColor: "#0095f6" + "20",
    borderWidth: 1,
    borderColor: "#0095f6" + "40",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  selectedReasonText: {
    color: "#0095f6",
    fontSize: 13,
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2e2e2e",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    minHeight: 120,
    lineHeight: 20,
  },
  charCount: {
    color: "#555",
    fontSize: 11,
    textAlign: "right",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: "#ed4956",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  centerContent: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
    marginTop: 16,
  },
  successIcon: {
    marginBottom: 16,
  },
  doneTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  doneSubtitle: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: "#0095f6",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 48,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
