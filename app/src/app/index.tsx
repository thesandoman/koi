import { Redirect } from "expo-router";
import { useKoi } from "@/engine/store";

export default function Index() {
  const { s } = useKoi();
  return <Redirect href={s.onboarded ? "/intros" : "/onboarding"} />;
}
