import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base = "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[15px] font-semibold transition-[transform,background-color,box-shadow] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]";
const variants = {
  primary: "bg-primary text-primary-foreground shadow-[0_1px_0_rgb(255_255_255/.2)_inset,0_6px_14px_-6px_color-mix(in_oklab,var(--rose)_70%,transparent)] hover:-translate-y-px",
  plain: "border border-border bg-card text-foreground hover:bg-muted",
  quiet: "border border-border bg-transparent text-foreground hover:bg-muted",
  ink: "bg-foreground text-background hover:-translate-y-px",
} as const;
type V = keyof typeof variants;

export function Btn({ variant = "plain", className, ...p }: { variant?: V } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn(base, variants[variant], className)} {...p} />;
}
export function LinkBtn({ variant = "plain", className, ...p }: { variant?: V } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn(base, variants[variant], className)} {...p} />;
}
