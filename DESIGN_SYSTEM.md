# Design System — ski-frontend

> **Visual source of truth for the web dashboard.** Every page must match it. The reference
> implementation is `docs/reference/dashboard.html` — treat that as the target look & feel,
> but **build in React + TypeScript + Tailwind + shadcn/ui**, do not paste raw HTML.
> Centralize tokens; never hardcode hex values in components.

---

## 1. Principles (the "why" — keep these)

1. **Indian Oil identity, used with restraint.** Deep **navy** = structure (sidebar, headings, text). **White** = surfaces. **Orange** = energy only — active nav item, primary buttons, KPI accents, the one chart line. Orange is the spice, not the meal; if a screen looks orange-heavy, pull it back.
2. **Reconciliation is the hero.** This is a money-tally product. On any screen where it's relevant, the cash/stock reconciliation status gets visual priority (the dashboard's "Today's reconciliation" panel is the signature). Don't bury it in a generic stat grid.
3. **Real data, real copy.** Indane cylinder types (14.2kg Domestic, 19kg Commercial, 5kg, 47.5kg Commercial), ₹ in Indian lakh grouping (₹3,42,180), active-voice labels ("Close day", "Export"), and the same word through a flow (a "Close day" button → "Day closed" toast).
4. **Money is tabular.** All amounts and quantities use tabular-figures so columns align. Use the `Archivo` weight for big numbers.
5. **Quality floor, quietly.** Responsive to mobile, visible keyboard focus, `prefers-reduced-motion` respected. Loading = skeletons, empty = an invitation to act, errors = what happened + how to fix.

---

## 2. Color tokens

| Token | Hex | Use |
|---|---|---|
| `orange` | `#F26522` | primary / active / energy |
| `orange-600` | `#D9551A` | hover on primary |
| `orange-50` | `#FFF1E9` | icon chips, soft fills |
| `navy` | `#10295C` | sidebar, headings, structure |
| `navy-700` | `#1C3D78` | gradients |
| `navy-900` | `#0A1A3F` | sidebar gradient base |
| `ink` | `#0E1B3A` | primary text |
| `muted` | `#64748B` | secondary text |
| `surface` | `#F5F7FB` | app background |
| `card` | `#FFFFFF` | cards/surfaces |
| `line` | `#E7EBF3` | hairlines |
| `ok` / `okbg` | `#1E9E62` / `#E7F6EE` | reconciled / settled |
| `bad` / `badbg` | `#E5484D` / `#FDECEC` | mismatch / error |
| `warn` / `warnbg` | `#E8920C` / `#FDF3E2` | pending / counting |

### tailwind.config.ts (extend)
```ts
theme: { extend: { colors: {
  orange:  { DEFAULT:'#F26522', 600:'#D9551A', 50:'#FFF1E9' },
  navy:    { DEFAULT:'#10295C', 700:'#1C3D78', 900:'#0A1A3F' },
  ink:'#0E1B3A', muted:'#64748B', surface:'#F5F7FB',
  card:'#FFFFFF', line:'#E7EBF3',
  ok:'#1E9E62', okbg:'#E7F6EE',
  bad:'#E5484D', badbg:'#FDECEC',
  warn:'#E8920C', warnbg:'#FDF3E2',
},
  borderRadius:{ xl:'16px' },
  boxShadow:{ card:'0 1px 2px rgba(16,41,92,.06), 0 8px 24px rgba(16,41,92,.06)' },
  fontFamily:{ display:['Archivo','sans-serif'], sans:['Inter','system-ui','sans-serif'] },
}}
```

### shadcn/ui — `globals.css` `:root` (HSL, maps shadcn semantics to this theme)
```css
:root{
  --background: 0 0% 100%;
  --foreground: 223 61% 14%;        /* ink */
  --card: 0 0% 100%;  --card-foreground: 223 61% 14%;
  --primary: 19 89% 54%;            /* orange */  --primary-foreground: 0 0% 100%;
  --secondary: 220 70% 21%;         /* navy   */  --secondary-foreground: 0 0% 100%;
  --muted: 218 33% 97%;  --muted-foreground: 215 16% 47%;
  --accent: 24 100% 96%;            /* orange-50 */ --accent-foreground: 220 70% 21%;
  --destructive: 358 75% 59%; --destructive-foreground: 0 0% 100%;
  --border: 222 30% 92%; --input: 222 30% 92%; --ring: 19 89% 54%;
  --radius: 0.9rem;
}
body{ background:#F5F7FB; }   /* app surface, not pure white */
```

---

## 3. Typography
- **Display:** `Archivo` (700/800) — headings, KPI numbers, table footers.
- **Body/UI:** `Inter` (400/500/600) — everything else.
- Load via `index.html` (`<link>` to Google Fonts) or `@fontsource/archivo` + `@fontsource/inter`.
- **Money & quantities:** add `tabular-nums` (`font-variant-numeric: tabular-nums`). Make a `<Money>` component (see §6).
- Scale: page title 20px/700 · card title 15px/700 · KPI value 25px/800 · body 13–14px · caption 11.5px/muted. Headings letter-spacing `-0.01em`.

---

## 4. Spacing, radius, shadow
8px grid. Cards: radius 16px, 1px `line` border, `shadow-card`, padding 16–18px. Content gap 20px. Page padding 24–28px.

---

## 5. Motion (Framer Motion)
Install `framer-motion`. Wrap everything in `useReducedMotion()` — if reduced, render final state with no animation.
- **Page/section reveal:** fade + 10px rise, stagger children ~40ms. `transition={{ duration:.5, ease:[.2,.7,.2,1] }}`.
- **KPI numbers:** count-up on mount, ease-out cubic, ~950ms (use `useMotionValue` + `animate`, or the `useCountUp` hook below).
- **Bars / gauges:** animate width from 0 → target, spring `{ stiffness:300, damping:30 }`.
- **Chart line:** draw-in via `pathLength` 0 → 1, ~1.1s.
- **Buttons:** `whileTap={{ scale:.97 }}`, hover shadow lift.
- **Rows / toasts:** slide+fade in; new realtime rows get a brief highlight (future, when verification ships).
Keep it restrained — motion serves the data landing, not decoration.

---

## 6. Components to build first (shared, reused on every page)
Build these before any page. Convention: shadcn primitives in `src/components/ui/`, the
app-specific composites in `src/components/app/`.

- **`AppShell`** — grid: `Sidebar` (248px, navy gradient) + `<main>` with `Topbar`. The reference shows exact nav items, active state (orange pill + glow), and the user chip.
- **`Sidebar`** — nav groups ("Daily operations", "Manage"), lucide-react icons, active = orange. Role-gate items (pricing/catalog/audit/users = super_admin only).
- **`Topbar`** — page title + date subtitle, "Day open" status pill, Export (ghost) + Close day (primary) buttons, notification bell, profile.
- **`KpiCard`** — icon chip, label, big tabular value (count-up), sub-line (delta/▲ or context), optional progress bar, optional "Owner" lock chip (hide value entirely for non-owner).
- **`StatusPill`** — variants: `ok` (settled/verified), `warn` (counting/pending), `open` (day open). Map to ok/warn/okbg/warnbg.
- **`Card`** + **`CardHeader`** (title + hint + right slot).
- **`DataTable`** — right-aligned numeric cols, tabular nums, sticky header, hover row, bold footer (totals).
- **`Money`** — formats Indian grouping, applies `tabular-nums`, prefixes `₹`.
- **`Gauge`** — label + small caption + track with animated fill (the cylinder-movement bars).
- **`ReconcilePanel`** — the signature: status (check/warn), expected vs counted vs variance rows, flame-tinted background.
- **`Button`** — `primary` (orange), `ghost` (white + border); `whileTap` scale.

### `useCountUp` + Indian format helper
```ts
export const inr = (n: number) => {
  const s = Math.round(n).toString();
  let last3 = s.slice(-3), rest = s.slice(0, -3);
  if (rest) { rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ','); last3 = ',' + last3; }
  return rest + last3;                                  // 342180 -> "3,42,180"
};
```

---

## 7. Do / Don't
- **Do** route every color through tokens; reuse the shared components; keep money tabular; gate owner-only data (net profit, margins, audit) server-side too.
- **Don't** add a second accent color, use orange for large fills/backgrounds, use pie charts where a gauge/flow tells the truth better, or invent playful copy. No emojis in the UI.

---

## 8. Reference
`docs/reference/dashboard.html` is the visual target for the Dashboard page and the source for
all component styling above. Match its spacing, hierarchy, and motion; translate to React/Tailwind/shadcn.
