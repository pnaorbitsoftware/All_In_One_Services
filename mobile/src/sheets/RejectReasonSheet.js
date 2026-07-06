import React, { useEffect, useState } from "react";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";

export default function RejectReasonSheet({ visible, booking, submitting, onClose, onSubmit }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (visible) setReason("");
  }, [visible]);

  const isDisabled = submitting || !reason.trim();

  return (
    <ModalSheet
      visible={visible}
      title="Reject Booking"
      subtitle={booking ? `${booking.service} | ${booking.name}` : "Add a reason for rejection."}
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? "Rejecting..." : "Reject request"}
          icon="close-circle-outline"
          variant="danger"
          disabled={isDisabled}
          onPress={() => onSubmit(reason)}
        />
      }
    >
      <TextField
        label="Rejection Reason"
        value={reason}
        onChangeText={setReason}
        placeholder="Explain why you are rejecting this request (required)"
        multiline
      />
    </ModalSheet>
  );
}
