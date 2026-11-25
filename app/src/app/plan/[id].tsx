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
import { Btn, LinkText, Rule, T } from "@/components/ui";
import { HoldPinky } from "@/components/HoldPinky";
import { ArrowLeftIcon, CheckIcon } from "@/components/icons";

export default function PlanSpace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, t, now, confirm, place, send, more, friends, kindly, block, report, answer } = useKoi();
  const c = useColors();
  const router = useRouter();
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [menu, setMenu] = useState<null | "open" | "kindly" | "block">(null);
  const pk = s.pinkies.find((p) => p.id === id);
  const p = pk ? personById.get(pk.personId) : undefined;

  // Outsiders and ended plans get a plain not-found, never a hint of why.
  if (!pk || !p || pk.status !== "active") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 24, gap: 16 }}>
        <T v="title">{t("close.closed")}</T>
        <LinkText label={t("common.back")} onPress={() => router.replace("/plans")} />
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
  const chosen = pk.venueKey ? venueByKey.get(pk.venueKey) : undefined;

  const submit = () => {
    const r = send(pk.id, text);
    if (r.ok) { setText(""); setNote(""); return; }
    setNote(t(r.reason === "limit" ? "chat.limit" : r.reason === "link" ? "chat.nudge.link" : r.reason === "contact" ? "chat.nudge.contact" : r.reason === "money" ? "chat.nudge.money" : "chat.long"));
  };
  const ans = (a: CloseAnswer) => answer(pk.id, a);
  const f = fonts[s.lang];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={() => router.back()} style={{ minHeight: 48, justifyContent: "center", alignSelf: "flex-start" }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}><ArrowLeftIcon color={c.body} /><T muted>{t("common.back")}</T></View>
          </Pressable>

          <T v="small" muted>{t("plans.with", { name })}</T>
          <View style={{ gap: 4 }}>
            <T v="display" accessibilityRole="header">{chosen ? venueName(chosen, s.lang) : t("plan.choose")}</T>
            <T v="title" style={{ color: c.leaf }}>{pk.startsAt ? fmtTime(pk.startsAt, s.lang) : t("plan.noTime")}</T>
            {late && <T v="small" muted>{t("plan.late")}</T>}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 18 }}>
            {options.map((v) => {
              const on = pk.venueKey === v.key;
              return (
                <Pressable key={v.key} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => place(pk.id, v.key)} style={{ minHeight: 44, justifyContent: "center" }}>
                  <T style={{ color: on ? c.leaf : c.body, fontFamily: on ? f.semi : f.body, textDecorationLine: on ? "underline" : "none" }}>{venueName(v, s.lang)}</T>
                </Pressable>
              );
            })}
          </View>
          <T v="small" muted>{shared.length > 0 && chosen ? t("plan.shared", { place: venueName(chosen, s.lang) }) : t("plan.noShared")}</T>

          {!pk.confMe ? (
            <View style={{ alignItems: "center", opacity: hasPlan ? 1 : 0.4 }} pointerEvents={hasPlan ? "auto" : "none"}>
              <HoldPinky tone="leaf" name={chosen ? venueName(chosen, s.lang) : name} label={t("plan.confirm")} hint={t("hold.seal")} done={t("hold.sealed")} onComplete={() => confirm(pk.id)} />
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}><CheckIcon color={c.leaf} /><T style={{ color: c.leaf, fontFamily: f.semi }}>{t("plan.you")}</T></View>
              {pk.confThem && <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}><CheckIcon color={c.leaf} /><T style={{ color: c.leaf, fontFamily: f.semi }}>{t("plan.them", { name })}</T></View>}
              {both && <T v="title" style={{ color: c.leaf }}>{t("plan.both")}</T>}
            </View>
          )}
          {pk.cleared && !both && <T v="small" muted>{t("plan.cleared")}</T>}
          <T v="small" muted>{t("plan.safety")}</T>
          {hasPlan && <LinkText label={t("plan.share")} onPress={() => Share.share({ message: `${venueName(chosen!, "en")} · ${fmtTime(pk.startsAt!, "en")}` }).catch(() => {})} />}

          {(view === "ask" || view === "waiting") && (<><Rule />
            {view === "ask" ? (
              <View style={{ gap: 2 }}>
                <T v="display" style={{ fontSize: 28, lineHeight: 32 }}>{t("close.ask", { name })}</T>
                <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 22 }}>
                  <LinkText label={t("close.yes")} onPress={() => ans("yes")} /><LinkText label={t("close.no")} onPress={() => ans("no")} tone="muted" /><LinkText label={t("close.didnt")} onPress={() => ans("didnt_meet")} tone="muted" />
                </View>
              </View>
            ) : <T>{t("close.wait")}</T>}
          </>)}

          <Rule />
          <T v="title">{t("chat.h")}</T>
          {pk.messages.length === 0 && <T muted>{t("chat.empty")}</T>}
          {pk.messages.map((m) => (
            <View key={m.id} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "85%", backgroundColor: m.from === "me" ? c.ink : c.bg2, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 }}>
              <T style={{ color: m.from === "me" ? c.bg : c.ink }}>{m.body}</T>
            </View>
          ))}
          {!canChat && (<><T v="small" muted>{t("chat.limit")}</T>{!pk.moreGranted && <LinkText label={t("chat.more")} onPress={() => more(pk.id)} />}</>)}
          {note ? <T v="small" style={{ color: c.rose }}>{note}</T> : null}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TextInput value={text} onChangeText={setText} placeholder={t("chat.placeholder")} placeholderTextColor={c.body} accessibilityLabel={t("chat.placeholder")} editable={canChat}
              style={{ flex: 1, minHeight: 48, borderRadius: radius.full, paddingHorizontal: 18, color: c.ink, backgroundColor: c.bg2, fontFamily: f.body, fontSize: 16 }} onSubmitEditing={submit} />
            <Btn variant="ink" label={t("chat.send")} disabled={!canChat || !text.trim()} onPress={submit} />
          </View>

          <Rule />
          {menu === null && <LinkText label={t("ways.h")} tone="muted" onPress={() => setMenu("open")} />}
          {menu === "open" && (
            <View>
              <LinkText label={t("ways.friends")} onPress={() => { friends(pk.id); router.replace("/plans"); }} />
              <LinkText label={t("ways.kindly")} onPress={() => setMenu("kindly")} />
              <LinkText label={t("ways.report")} tone="muted" onPress={() => { report(p.id); setNote(t("ways.reported")); }} />
              <LinkText label={t("ways.block")} tone="muted" onPress={() => setMenu("block")} />
            </View>
          )}
          {menu === "kindly" && (
            <View>
              <T v="small" muted>{t("ways.pick")}</T>
              {(Object.keys(END_KINDLY) as (keyof typeof END_KINDLY)[]).map((k) => <LinkText key={k} label={t(`end.${k}`)} onPress={() => { kindly(pk.id); router.replace("/plans"); }} />)}
            </View>
          )}
          {menu === "block" && (<View><T>{t("ways.blockConfirm", { name })}</T><LinkText label={t("ways.block")} tone="rose" onPress={() => { block(pk.id); router.replace("/plans"); }} /><LinkText label={t("common.cancel")} tone="muted" onPress={() => setMenu("open")} /></View>)}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
