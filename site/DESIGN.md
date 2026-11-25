---
name: Koi
description: A place-first dating app for Bangkok, shown as a phone you can use on a tracing-paper map of the city.
colors:
  paper: "#F4F6F1"
  paper-2: "#E8EDE6"
  card: "#FBFCF9"
  ink: "#15201C"
  body: "#46534D"
  line: "#CCD6CF"
  rose: "#C42E57"
  leaf: "#2E7D5B"
  leaf-soft: "#DCEFE4"
  pond: "#14201B"
  pond-card: "#1F2E28"
  pond-line: "#33443C"
  pond-ink: "#EEF2EC"
  pond-body: "#AEBDB5"
  rose-on-pond: "#F28CA6"
  leaf-on-pond: "#62C195"
typography:
  display:
    fontFamily: "Bricolage, Noto Thai Koi, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 11vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage, Noto Thai Koi, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.4vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage, Noto Thai Koi, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter Koi, Noto Thai Koi, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter Koi, Noto Thai Koi, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  phone: "44px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "20px"
  lg: "28px"
  xl: "56px"
  section: "112px"
components:
  button-primary:
    backgroundColor: "{colors.rose}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 20px"
  button-plain:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 20px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 20px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.body}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 14px"
  chip-selected:
    backgroundColor: "{colors.leaf-soft}"
    textColor: "{colors.ink}"
  bento-cell:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "28px"
  phone-frame:
    backgroundColor: "{colors.paper-2}"
    rounded: "{rounded.phone}"
    padding: "6px"
---

# Design System: Koi

## Overview

**Creative North Star: "The Tracing-Paper Pond"**

Koi looks like a Bangkok street map drawn on tracing paper, laid over a pond. The ground is a cool paper in daylight and a deep pond green-black at night, chosen by the visitor's system setting. Roads are dotted hairlines, the river is a soft wide band, parks are pale leaf patches, and the only things that sit on top are places: leaf-green pins. People never appear. Everything is shown through one phone that follows the reader down the page, so the product explains itself by being used.

The tone is calm and grown-up. Type is big and tight and carries the personality; surfaces stay quiet. Rose is rationed: it appears only on primary actions and at the moment two people unlock. The signature is a ripple, like a koi surfacing, that spreads from every pin you drop and, in rose, from the unlock.

**Key Characteristics:**
- Cool paper or pond ground, never warm cream.
- Large Bricolage Grotesque headings, Inter for reading, Noto Sans Thai for Thai.
- One device (the phone) as the main stage; no feature-card grid.
- Leaf green means private, safe, confirmed. Rose means act or unlock.
- Motion answers a touch: pin drop spring, ripple, sliding pill, screen swap.

## Colors

A cool paper-and-pond neutral field with two working accents: leaf for state, rose for action.

### Primary
- **Koi Rose** (#C42E57; #F28CA6 on pond): primary buttons and the unlock panel only. Its rarity is the point.

### Secondary
- **Pond Leaf** (#2E7D5B; #62C195 on pond): pins you have placed, confirmed ticks, private and safe notes, selected switches.
- **Leaf Wash** (#DCEFE4; #20382D on pond): parks on the map, private-note fills, selected chips.

### Neutral
- **Cool Paper** (#F4F6F1) and **Pond** (#14201B): page ground, light and dark.
- **Paper Two** (#E8EDE6; #1A2822): the Join band, phone bezel, inset blocks.
- **Card** (#FBFCF9; #1F2E28): phone screens, bento cells, inputs.
- **Ink** (#15201C; #EEF2EC) and **Body** (#46534D; #AEBDB5): headings and reading text.
- **Line** (#CCD6CF; #33443C): hairlines, roads, borders.

### Named Rules
**The One Voice Rule.** Rose covers a small share of any view and never decorates. If it is not an action or an unlock, it is not rose.
**The Leaf Means State Rule.** Green only ever says "yours, private, safe, or confirmed".

## Typography

**Display Font:** Bricolage Grotesque (with Noto Sans Thai, system sans fallback)
**Body Font:** Inter (with Noto Sans Thai, system sans fallback)

**Character:** Bricolage is warm and slightly eccentric at large sizes; Inter keeps reading plain. Both are brand-pinned. Thai uses Noto Sans Thai with looser leading and no negative tracking.

### Hierarchy
- **Display** (800, clamp 3.25–6rem, 0.92, -0.035em): the hero headline only.
- **Headline** (700, clamp 2–3.25rem, 1.02, -0.03em): section headings and the big "No swiping." statements.
- **Title** (700, 1.25rem, 1.2): names and card headings inside the phone.
- **Body** (400, 1.0625rem, 1.6): reading text, max about 46ch.
- **Label** (600, 0.8125rem, 1.4): captions and form labels, sentence case.

### Named Rules
**The Tight Headline Rule.** Headlines tighten tracking (never below -0.04em) in Latin and reset to 0 in Thai.

## Layout

A centered hero with the phone rising beneath it, then a two-column story: narrow text on the left, a sticky phone on the right, each step about one viewport tall. Below 1024px each step shows its own phone inline. Content is left-aligned inside a 72rem container with 20px side gutters; sections breathe at about 112px. The "never" section is a six-column bento with deliberately unequal cells, and the Join band is a full-width Paper Two strip.

## Elevation & Depth

Mostly tonal: cards separate from the ground by a small step in lightness plus a hairline. Shadows are reserved for objects that lift: the phone, the nav pill, notifications, and the sign-up card. They always carry an offset and a soft blur (for example `0 12px 24px` plus `0 50px 80px -24px`), never a hard offset and never a colored halo.

### Named Rules
**The Lifted Objects Only Rule.** If a thing is not a device, a floating bar, or a notification, it gets no shadow.

## Shapes

Generous and soft: pills for actions and chips (9999px), 32px cells in the bento, 24px for inner screens, 44px for the phone. One outline weight (1px hairlines) throughout; map pins use a 3px stroke on a teardrop taken from the logo's "i".

## Components

### Buttons
- **Shape:** full pill, 44px tall minimum.
- **Primary:** rose fill, white text on light, pond text on pink in dark; soft rose shadow; lifts 1px on hover.
- **Plain / Ink / Quiet:** card fill with border, ink fill, or transparent with border. Press scales to 0.98.

### Chips
- Pill, 44px tall, hairline border; selected chips take Leaf Wash and a leaf border.

### Inputs / Fields
- 48px tall, 12px radius, card fill and hairline border; caret and checkbox use leaf; keyboard focus is a 3px blue ring offset 3px.

### Navigation
- A solid pill floating at the top: wordmark left, language segmented control and the rose Join button right.

### Segmented control
- A pill on Paper Two with a card-colored thumb that slides on a spring and can be dragged; used for language and for "Your phone / Sam's phone".

### Phone (signature)
- A 9:19.5 device with a thin bezel, side buttons, a black island and an inset screen. The hero version tilts back about 24 degrees and flattens as you scroll. Screens swap with a short fade and rise.

## Do's and Don'ts

### Do:
- **Do** keep rose to primary actions and the unlock panel.
- **Do** ripple from the pin (leaf) and from the unlock (rose).
- **Do** keep the ground cool: Cool Paper by day, Pond by night.
- **Do** label example people and places as examples.
- **Do** keep tap targets at 44px or more and run every string in Thai and English.

### Don't:
- **Don't** add feature cards with an icon, a heading and text.
- **Don't** put people, faces or live locations on the map.
- **Don't** use gradients, glass blur or hard offset shadows.
- **Don't** add eyebrow labels above headings or numbered steps.
- **Don't** invent statistics, testimonials or partner names.
