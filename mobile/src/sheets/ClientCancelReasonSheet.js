import React, { useEffect, useState } from "react";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";

export default function ClientCancelReasonSheet({ visible, booking, submitting, onClose, onSubmit }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (visible) setReason("");
  }, [visible]);

  const isDisabled = submitting || !reason.trim();

  return (
    <ModalSheet
      visible={visible}
      title="Cancel Booking"
      subtitle={booking ? `${booking.service} | ${booking.name}` : "Please provide a reason for cancelling."}
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? "Cancelling..." : "Confirm Cancellation"}
          icon="close-circle-outline"
          variant="danger"
          disabled={isDisabled}
          onPress={() => onSubmit(reason)}
        />
      }
    >
      <TextField
        label="Cancellation Reason"
        value={reason}
        onChangeText={setReason}
        placeholder="Explain why you are cancelling this booking (required)"
        multiline
      />
    </ModalSheet>
  );
}
