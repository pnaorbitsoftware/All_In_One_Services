import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";
import { durationOptions } from "../lib/formatters";
import { colors, radius, useThemeColors } from "../theme";

const emptyForm = {
  name: "",
  phone: "",
  service: "",
  address: "",
  problemDescription: "",
  date: "",
  time: "10:00",
  duration: "1 hour",
  providerId: "",
};

const defaultT = (_key, fallback) => fallback;

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDisplayDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function toApiDate(displayDate) {
  const [day, month, year] = displayDate.split("-");
  return `${year}-${month}-${day}`;
}

function formatTimeLabel(value) {
  const [hourValue, minuteValue] = value.split(":").map(Number);
  const hour = hourValue % 12 || 12;
  const minute = String(minuteValue || 0).padStart(2, "0");
  return `${hour}:${minute} ${hourValue >= 12 ? "PM" : "AM"}`;
}

function dateFromDisplay(displayDate) {
  if (!displayDate) return startOfToday();
  const [day, month, year] = displayDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateWithTime(time) {
  const value = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  value.setHours(hours || 0, minutes || 0, 0, 0);
  return value;
}

function PickerField({ label, value, placeholder, icon, onPress }) {
  const theme = useThemeColors();
  return (
    <View style={styles.pickerWrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.pickerField,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.pickerValue, { color: value ? theme.text : theme.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <MaterialCommunityIcons name={icon} size={21} color={theme.teal} />
      </Pressable>
    </View>
  );
}

export default function BookingSheet({ visible, service, user, submitting, t = defaultT, onClose, onSubmit }) {
  const theme = useThemeColors();
  const { width } = useWindowDimensions();
  const [form, setForm] = useState(emptyForm);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const stackDateTimeFields = width < 380;

  useEffect(() => {
    if (!visible) return;
    setForm({
      ...emptyForm,
      name: user?.name || "",
      phone: user?.phone || "",
      service: service?.category || service?.name || "",
      providerId: service?.providerId || "",
      date: formatDisplayDate(startOfToday()),
    });
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [service, user, visible]);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const minDate = startOfToday();

  const handleDateChange = (_event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (!selectedDate) return;

    const nextDate = selectedDate < minDate ? minDate : selectedDate;
    update("date")(formatDisplayDate(nextDate));
  };

  const handleTimeChange = (_event, selectedTime) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (!selectedTime) return;

    const hours = String(selectedTime.getHours()).padStart(2, "0");
    const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
    update("time")(`${hours}:${minutes}`);
  };

  const submit = () => {
    onSubmit({
      ...form,
      date: toApiDate(form.date),
    });
  };

  return (
    <ModalSheet
      visible={visible}
      title={t("booking.title", "Book service")}
      subtitle={service ? `${service.name} | ${service.category}` : t("booking.subtitle", "Create a service request")}
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? t("common.saving", "Saving...") : t("booking.submit", "Submit booking")}
          icon="calendar-check-outline"
          disabled={submitting}
          onPress={submit}
        />
      }
    >
      <TextField label={t("booking.name", "Name")} value={form.name} onChangeText={update("name")} placeholder={t("booking.customerName", "Customer name")} />
      <TextField label={t("booking.phone", "Phone")} value={form.phone} onChangeText={update("phone")} placeholder="+91..." keyboardType="phone-pad" />
      <TextField label={t("booking.service", "Service")} value={form.service} onChangeText={update("service")} placeholder={t("booking.serviceCategory", "Service category")} />
      <TextField label={t("booking.address", "Address")} value={form.address} onChangeText={update("address")} placeholder={t("booking.addressPlaceholder", "House, street, city")} multiline />
      <TextField
        label={t("booking.problemDetails", "Problem details")}
        value={form.problemDescription}
        onChangeText={update("problemDescription")}
        placeholder={t("booking.problemPlaceholder", "Describe the work needed")}
        multiline
      />
      <View style={[styles.row, stackDateTimeFields && styles.stackedRow]}>
        <View style={styles.rowField}>
          <PickerField
            label={t("booking.date", "Date")}
            value={form.date}
            placeholder="dd-mm-yyyy"
            icon="calendar-month-outline"
            onPress={() => setShowDatePicker(true)}
          />
        </View>
        <View style={styles.rowField}>
          <PickerField
            label={t("booking.time", "Time")}
            value={formatTimeLabel(form.time)}
            placeholder={t("booking.selectTime", "Select time")}
            icon="clock-time-four-outline"
            onPress={() => setShowTimePicker(true)}
          />
        </View>
      </View>
      {showDatePicker ? (
        <DateTimePicker
          value={dateFromDisplay(form.date)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minDate}
          onValueChange={handleDateChange}
        />
      ) : null}
      {showTimePicker ? (
        <DateTimePicker
          value={dateWithTime(form.time)}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          is24Hour={false}
          onValueChange={handleTimeChange}
        />
      ) : null}
      <View style={styles.durationWrap}>
        <Text style={[styles.label, { color: theme.text }]}>{t("booking.duration", "Duration")}</Text>
        <View style={styles.durationList}>
          {durationOptions.map((duration) => {
            const active = form.duration === duration;
            return (
              <Pressable
                accessibilityRole="button"
                key={duration}
                onPress={() => update("duration")(duration)}
                style={[
                  styles.durationChip,
                  { borderColor: active ? theme.teal : theme.border },
                  active && { backgroundColor: theme.teal },
                ]}
              >
                <Text style={[styles.durationText, { color: active ? "#ffffff" : theme.text }]}>
                  {duration}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  activeDuration: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  activeDurationText: {
    color: "#ffffff",
  },
  durationChip: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  durationList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  durationWrap: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  pickerField: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickerValue: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    minWidth: 0,
  },
  pickerWrap: {
    gap: 7,
  },
  placeholder: {
    color: "#94a3b8",
  },
  pressed: {
    opacity: 0.78,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowField: {
    flex: 1,
    minWidth: 0,
  },
  stackedRow: {
    flexDirection: "column",
  },
});
