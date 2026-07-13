import React, { useEffect, useState } from "react";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";

export default function CancelReasonSheet({ visible, booking, submitting, onClose, onSubmit }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (visible) setReason("");
  }, [visible]);

  return (
    <ModalSheet
      visible={visible}
      title="Cancel job"
      subtitle={booking ? `${booking.service} | ${booking.name}` : "Add a reason for cancellation."}
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? "Cancelling..." : "Cancel job"}
          icon="close-circle-outline"
          variant="danger"
          disabled={submitting}
          onPress={() => onSubmit(reason)}
        />
      }
    >
      <TextField
        label="Reason"
        value={reason}
        onChangeText={setReason}
        placeholder="Explain why this job cannot be completed"
        multiline
      />
    </ModalSheet>
  );
}
