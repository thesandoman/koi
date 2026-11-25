import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { END_KINDLY, chatAllowed, type CloseAnswer } from "@/rules/pinky-core";
import { personById, personName, venueByKey, venueName, VENUES } from "@/data";
import { closeView } from "@/engine/logic";
import { sharedPlaceKeys } from "@/lib/shared";
import { fmtTime } from "@/lib/format";
import { fonts, radius, useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { Btn, Card, Chip, Private, T } from "@/components/ui";
import { ArrowLeftIcon, CheckIcon } from "@/components/icons";

export default function PlanSpace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, t, now, confirm, place, send, more, friends, kindly, block, report, answer } = useKoi();
  const c = useColors();
  const router = useRouter();
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [menu, setMenu] = useState<null | "kindly" | "block">(null);
  const pk = s.pinkies.find((p) => p.id === id);
  const p = pk ? personById.get(pk.personId) : undefined;

  // Outsiders and ended plans get a plain not-found, never a hint of why.
  if (!pk || !p || pk.status !== "active") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 20, gap: 16 }}>
        <T v="title">{t("close.closed")}</T>
        <Btn label={t("common.back")} onPress={() => router.replace("/plans")} />
      </SafeAreaView>
    );
  }
  const name = personName(p, s.lang);
  const shared = sharedPlaceKeys(s.pins, p.pins);
  const options = (shared.length ? shared : VENUES.map((v) => v.key)).map((k) => venueByKey.get(k)!);
  const hasPlan = !!pk.venueKey && !!pk.startsAt;
  const both = pk.confMe && pk.confThem;
  const mine = pk.messages.filter((m) => m.from === "me").length;
  const canChat = chatAllowed({ planHasPlaceAndTime: hasPlan, mySentBeforePlan: mine, extraGranted: pk.moreGranted });
  const view = closeView(pk, now());
  const late = pk.startsAt ? Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date(pk.startsAt))) >= 22 : false;

  const submit = () => {
    const r = send(pk.id, text);
    if (r.ok) { setText(""); setNote(""); return; }
    setNote(t(r.reason === "limit" ? "chat.limit" : r.reason === "link" ? "chat.nudge.link" : r.reason === "contact" ? "chat.nudge.contact" : r.reason === "money" ? "chat.nudge.money" : "chat.long"));
  };
  const ans = (a: CloseAnswer) => answer(pk.id, a);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center" }}><View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}><ArrowLeftIcon color={c.body} /><T muted>{t("common.back")}</T></View></Pressable>
          <T v="display" style={{ fontSize: 32, lineHeight: 36 }} accessibilityRole="header">{t("plans.with", { name })}</T>

          <Card>
            <T v="label" muted>{t("plan.place")}</T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {options.map((v) => <Chip key={v.key} label={venueName(v, s.lang)} on={pk.venueKey === v.key} onPress={() => place(pk.id, v.key)} />)}
            </View>
            {shared.length > 0 && pk.venueKey && <T v="small" muted>{t("plan.shared", { place: venueName(venueByKey.get(pk.venueKey)!, s.lang) })}</T>}
            {shared.length === 0 && <T v="small" muted>{t("plan.noShared")}</T>}
            <T v="label" muted>{t("plan.time")}</T>
            <T v="title">{pk.startsAt ? fmtTime(pk.startsAt, s.lang) : t("plan.noTime")}</T>
            {late && <T v="small" muted>{t("plan.late")}</T>}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              {!pk.confMe ? <Btn variant="primary" label={t("plan.confirm")} disabled={!hasPlan} onPress={() => confirm(pk.id)} /> : <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}><CheckIcon color={c.leaf} /><T style={{ color: c.leaf, fontFamily: fonts[s.lang].semi }}>{t("plan.you")}</T></View>}
              {pk.confThem && <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}><CheckIcon color={c.leaf} /><T style={{ color: c.leaf, fontFamily: fonts[s.lang].semi }}>{t("plan.them", { name })}</T></View>}
            </View>
            {both ? <T v="label" style={{ color: c.leaf }}>{t("plan.both")}</T> : pk.cleared ? <T v="small" muted>{t("plan.cleared")}</T> : null}
            <Private><T v="small">{t("plan.safety")}</T></Private>
            {hasPlan && <Btn variant="quiet" label={t("plan.share")} onPress={() => Share.share({ message: `${venueName(venueByKey.get(pk.venueKey!)!, "en")} · ${fmtTime(pk.startsAt!, "en")}` }).catch(() => {})} />}
          </Card>

          {(view === "ask" || view === "waiting") && (
            <Card>
              {view === "ask" ? (
                <>
                  <T v="title">{t("close.ask", { name })}</T>
                  <Btn variant="ink" label={t("close.yes")} onPress={() => ans("yes")} />
                  <Btn label={t("close.no")} onPress={() => ans("no")} />
                  <Btn label={t("close.didnt")} onPress={() => ans("didnt_meet")} />
                </>
              ) : <T>{t("close.wait")}</T>}
            </Card>
          )}

          <Card>
            <T v="title">{t("chat.h")}</T>
            {pk.messages.length === 0 && <T muted>{t("chat.empty")}</T>}
            {pk.messages.map((m) => (
              <View key={m.id} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "85%", backgroundColor: m.from === "me" ? c.ink : c.bg2, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 }}>
                <T style={{ color: m.from === "me" ? c.bg : c.ink }}>{m.body}</T>
              </View>
            ))}
            {!canChat && (<><T v="small" muted>{t("chat.limit")}</T>{!pk.moreGranted && <Btn variant="quiet" label={t("chat.more")} onPress={() => more(pk.id)} />}</>)}
            {note ? <T v="small" style={{ color: c.rose }}>{note}</T> : null}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput value={text} onChangeText={setText} placeholder={t("chat.placeholder")} placeholderTextColor={c.body} accessibilityLabel={t("chat.placeholder")} editable={canChat}
                style={{ flex: 1, minHeight: 48, borderWidth: 1, borderColor: c.line, borderRadius: radius.full, paddingHorizontal: 16, color: c.ink, backgroundColor: c.card, fontFamily: fonts[s.lang].body, fontSize: 16 }} onSubmitEditing={submit} />
              <Btn variant="ink" label={t("chat.send")} disabled={!canChat || !text.trim()} onPress={submit} />
            </View>
          </Card>

          <Card>
            <T v="title">{t("ways.h")}</T>
            <Btn label={t("ways.friends")} onPress={() => { friends(pk.id); router.replace("/plans"); }} />
            {menu === "kindly" ? (
              <View style={{ gap: 8 }}>
                <T v="small" muted>{t("ways.pick")}</T>
                {(Object.keys(END_KINDLY) as (keyof typeof END_KINDLY)[]).map((k) => <Btn key={k} label={t(`end.${k}`)} onPress={() => { kindly(pk.id); router.replace("/plans"); }} />)}
              </View>
            ) : <Btn label={t("ways.kindly")} onPress={() => setMenu("kindly")} />}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Btn style={{ flex: 1 }} variant="quiet" label={t("ways.report")} onPress={() => { report(p.id); setNote(t("ways.reported")); }} />
              {menu === "block" ? <Btn style={{ flex: 1 }} variant="ink" label={t("ways.blockConfirm", { name })} onPress={() => { block(pk.id); router.replace("/plans"); }} /> : <Btn style={{ flex: 1 }} variant="quiet" label={t("ways.block")} onPress={() => setMenu("block")} />}
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
