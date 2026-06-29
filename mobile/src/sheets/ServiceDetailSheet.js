import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import { imageForService } from "../data/catalog";
import { radius, useThemeColors } from "../theme";

function buildPackages(service) {
  const name = service?.name || "Home service";
  return [
    { id: "essential", name: `${name} essential`, price: 299, duration: service?.responseTime || "45 mins", rating: 4.8, reviews: 128, includes: ["Professional inspection", "Standard service labour", "Safety and quality check"] },
    { id: "deep", name: `${name} complete care`, price: 599, duration: "90 mins", rating: 4.9, reviews: 86, popular: true, includes: ["Everything in Essential", "Deep service and cleaning", "30-day service assurance"] },
    { id: "premium", name: `${name} premium`, price: 899, duration: "2 hrs", rating: 4.9, reviews: 54, includes: ["Complete care package", "Priority professional", "Consumables up to ₹150"] },
  ];
}

export default function ServiceDetailSheet({ service, visible, onClose, onBook }) {
  const theme = useThemeColors();
  const [quantities, setQuantities] = useState({});
  const packages = useMemo(() => buildPackages(service), [service]);
  useEffect(() => { if (visible) setQuantities({}); }, [service, visible]);
  if (!service) return null;

  const itemCount = Object.values(quantities).reduce((sum, value) => sum + value, 0);
  const total = packages.reduce((sum, item) => sum + item.price * (quantities[item.id] || 0), 0);
  const unavailable = service.isBookable === false || ["inactive", "absent"].includes(service.availabilityStatus);
  const changeQuantity = (id, delta) => setQuantities((current) => ({ ...current, [id]: Math.max(0, (current[id] || 0) + delta) }));
  const continueBooking = () => {
    const selected = packages.filter((item) => quantities[item.id]).map((item) => ({ ...item, quantity: quantities[item.id] }));
    onBook({ ...service, selectedPackages: selected, packageCount: itemCount, packageTotal: total, price: total ? `₹${total}` : service.price });
  };

  return (
    <ModalSheet visible={visible} title={service.name} subtitle="Packages chosen for quality, value and convenience" onClose={onClose} footer={
      itemCount ? <View style={styles.cartBar}><View><Text style={[styles.cartMeta, { color: theme.textMuted }]}>{itemCount} {itemCount === 1 ? "item" : "items"}</Text><Text style={[styles.cartTotal, { color: theme.text }]}>₹{total}</Text></View><ActionButton title="View cart" icon="arrow-right" onPress={continueBooking} style={styles.cartButton} /></View> : null
    }>
      <View style={styles.hero}>
        <Image source={imageForService(service)} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroScrim} />
        <View style={styles.heroCopy}><View style={styles.ratingPill}><MaterialCommunityIcons name="star" size={14} color="#F79009" /><Text style={styles.ratingText}>{service.rating || 4.8} ({service.reviews || 120} reviews)</Text></View><Text style={styles.heroTitle}>Expert care for your home</Text><Text style={styles.heroSubtitle}>Verified professionals · service assurance</Text></View>
      </View>

      <View style={styles.quickNav}>{[["package-variant", "Packages"], ["shield-check", "Warranty"], ["star-outline", "Reviews"]].map(([icon, label]) => <View key={label} style={styles.quickItem}><View style={[styles.quickIcon, { backgroundColor: theme.tealSoft }]}><MaterialCommunityIcons name={icon} size={21} color={theme.teal} /></View><Text style={[styles.quickText, { color: theme.text }]}>{label}</Text></View>)}</View>

      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: theme.text }]}>Choose a package</Text><Text style={[styles.sectionCopy, { color: theme.textMuted }]}>No hidden charges. Final price is confirmed before work.</Text></View>
      {packages.map((item) => <PackageCard key={item.id} item={item} quantity={quantities[item.id] || 0} onChange={(delta) => changeQuantity(item.id, delta)} />)}

      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: theme.text }]}>People also add</Text></View>
      <View style={styles.addOnRow}>{[["spray-bottle", "Deep sanitisation", 149], ["shield-home", "Extended warranty", 199]].map(([icon, name, price]) => <View key={name} style={[styles.addOn, { backgroundColor: theme.surfaceMuted }]}><MaterialCommunityIcons name={icon} size={25} color={theme.teal} /><Text style={[styles.addOnTitle, { color: theme.text }]}>{name}</Text><Text style={[styles.addOnPrice, { color: theme.textMuted }]}>₹{price}</Text></View>)}</View>

      <View style={[styles.guarantee, { backgroundColor: theme.tealSoft }]}><MaterialCommunityIcons name="shield-check" size={25} color={theme.teal} /><View style={styles.guaranteeCopy}><Text style={[styles.guaranteeTitle, { color: theme.text }]}>ServiceHub protection</Text><Text style={[styles.guaranteeBody, { color: theme.textMuted }]}>Background-checked professionals, damage protection and responsive support.</Text></View></View>
      {unavailable ? <Text style={[styles.unavailable, { backgroundColor: theme.roseSoft, color: theme.rose }]}>This professional is currently unavailable.</Text> : null}
    </ModalSheet>
  );
}

function PackageCard({ item, quantity, onChange }) {
  const theme = useThemeColors();
  return (
    <View style={[styles.package, { borderColor: item.popular ? theme.teal : theme.border, backgroundColor: theme.surface }]}>
      {item.popular ? <Text style={[styles.popular, { backgroundColor: theme.teal }]}>MOST BOOKED</Text> : null}
      <View style={styles.packageTop}><View style={styles.packageCopy}><Text style={[styles.packageTitle, { color: theme.text }]}>{item.name}</Text><View style={styles.packageMeta}><MaterialCommunityIcons name="star" size={13} color="#F79009" /><Text style={[styles.packageMetaText, { color: theme.textMuted }]}>{item.rating} ({item.reviews}) · {item.duration}</Text></View><Text style={[styles.packagePrice, { color: theme.text }]}>₹{item.price}</Text></View>
        {quantity ? <View style={[styles.stepper, { borderColor: theme.teal }]}><Pressable onPress={() => onChange(-1)} style={styles.stepperButton}><MaterialCommunityIcons name="minus" size={17} color={theme.teal} /></Pressable><Text style={[styles.quantity, { color: theme.teal }]}>{quantity}</Text><Pressable onPress={() => onChange(1)} style={styles.stepperButton}><MaterialCommunityIcons name="plus" size={17} color={theme.teal} /></Pressable></View> : <Pressable onPress={() => onChange(1)} style={[styles.addButton, { borderColor: theme.teal }]}><Text style={[styles.addText, { color: theme.teal }]}>Add</Text></Pressable>}
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      {item.includes.map((line) => <View key={line} style={styles.inclusion}><MaterialCommunityIcons name="check-circle" size={15} color={theme.success} /><Text style={[styles.inclusionText, { color: theme.textMuted }]}>{line}</Text></View>)}
      <Pressable style={styles.editPackage}><Text style={[styles.editPackageText, { color: theme.teal }]}>View package details</Text><MaterialCommunityIcons name="chevron-right" size={16} color={theme.teal} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: { alignItems: "center", borderRadius: 10, borderWidth: 1, minWidth: 74, paddingHorizontal: 18, paddingVertical: 9 },
  addOn: { borderRadius: radius.lg, flex: 1, gap: 6, padding: 14 },
  addOnPrice: { fontSize: 12, fontWeight: "800" },
  addOnRow: { flexDirection: "row", gap: 10 },
  addOnTitle: { fontSize: 13, fontWeight: "900", lineHeight: 17 },
  addText: { fontSize: 13, fontWeight: "900" },
  cartBar: { alignItems: "center", flexDirection: "row", gap: 14 },
  cartButton: { flex: 1 },
  cartMeta: { fontSize: 11, fontWeight: "700" },
  cartTotal: { fontSize: 18, fontWeight: "900" },
  divider: { height: 1, marginVertical: 13 },
  editPackage: { alignItems: "center", flexDirection: "row", gap: 2, marginTop: 12 },
  editPackageText: { fontSize: 12, fontWeight: "800" },
  guarantee: { alignItems: "flex-start", borderRadius: radius.lg, flexDirection: "row", gap: 11, padding: 16 },
  guaranteeBody: { fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 2 },
  guaranteeCopy: { flex: 1 },
  guaranteeTitle: { fontSize: 14, fontWeight: "900" },
  hero: { borderRadius: radius.xl, height: 190, overflow: "hidden" },
  heroCopy: { bottom: 17, left: 17, position: "absolute", right: 17 },
  heroImage: { height: "100%", width: "100%" },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(9,12,25,.42)" },
  heroSubtitle: { color: "rgba(255,255,255,.82)", fontSize: 12, fontWeight: "700", marginTop: 4 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  inclusion: { alignItems: "flex-start", flexDirection: "row", gap: 7, marginTop: 7 },
  inclusionText: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 17 },
  package: { borderRadius: radius.lg, borderWidth: 1, overflow: "hidden", padding: 16 },
  packageCopy: { flex: 1, minWidth: 0 },
  packageMeta: { alignItems: "center", flexDirection: "row", gap: 4, marginTop: 5 },
  packageMetaText: { fontSize: 11, fontWeight: "700" },
  packagePrice: { fontSize: 15, fontWeight: "900", marginTop: 8 },
  packageTitle: { fontSize: 16, fontWeight: "900", lineHeight: 21 },
  packageTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  popular: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: .6, marginBottom: 12, marginHorizontal: -16, marginTop: -16, paddingHorizontal: 16, paddingVertical: 6 },
  quantity: { fontSize: 13, fontWeight: "900" },
  quickIcon: { alignItems: "center", borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  quickItem: { alignItems: "center", flex: 1, gap: 6 },
  quickNav: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  quickText: { fontSize: 11, fontWeight: "800" },
  ratingPill: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "#fff", borderRadius: 999, flexDirection: "row", gap: 4, marginBottom: 8, paddingHorizontal: 9, paddingVertical: 5 },
  ratingText: { color: "#111827", fontSize: 10, fontWeight: "900" },
  sectionCopy: { fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 3 },
  sectionHeading: { marginTop: 8 },
  sectionTitle: { fontSize: 19, fontWeight: "900" },
  stepper: { alignItems: "center", borderRadius: 10, borderWidth: 1, flexDirection: "row", minHeight: 38 },
  stepperButton: { alignItems: "center", justifyContent: "center", minHeight: 38, width: 34 },
  unavailable: { borderRadius: radius.md, fontSize: 13, fontWeight: "800", padding: 12 },
});
