import React, { useEffect, useState } from "react";
import { Alert } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";

export default function EstimateSheet({ visible, booking, submitting, onClose, onSubmit }) {
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (visible) {
      setAmount(booking?.finalEstimateAmount ? String(booking.finalEstimateAmount) : "");
    }
  }, [booking, visible]);

  const submit = () => {
    const value = Number(String(amount).replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert("Estimate", "Enter a valid final estimate amount.");
      return;
    }

    onSubmit(value);
  };

  return (
    <ModalSheet
      visible={visible}
      title="Final estimate"
      subtitle={booking ? `${booking.service} | ${booking.name}` : "Send client payable estimate"}
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? "Sending..." : "Send estimate"}
          icon="cash-check"
          disabled={submitting}
          onPress={submit}
        />
      }
    >
      <TextField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="Example: 799"
        keyboardType="number-pad"
      />
    </ModalSheet>
  );
}
