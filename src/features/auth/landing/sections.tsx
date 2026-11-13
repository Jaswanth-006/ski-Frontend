import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  ClipboardList,
  Flame,
  Mail,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  PhoneCall,
  Plug,
  ReceiptText,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  Wind,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BrandMark } from '@/components/app/BrandMark'
import { cn } from '@/lib/cn'
import { AGENCY } from './agency'
import { focusLogin } from './focusLogin'
import { PHOTO_CREDITS, PHOTOS } from './photos'

const NAV = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#cylinders', label: 'Cylinders' },
  { href: '#safety', label: 'Safety' },
  { href: '#contact', label: 'Contact' },
]

function InView({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em]',
        light ? 'text-orange-50' : 'text-orange',
      )}
    >
      <Flame className="h-3.5 w-3.5" /> {children}
    </p>
  )
}

function SectionHead({ eyebrow, title, light = false }: { eyebrow: string; title: string; light?: boolean }) {
  return (
    <InView className="mx-auto mb-10 max-w-xl text-center">
      <Eyebrow light={light}>{eyebrow}</Eyebrow>
      <h2 className={cn('mt-2 text-[28px] font-bold leading-tight sm:text-[34px]', light ? 'text-white' : 'text-navy')}>
        {title}
      </h2>
    </InView>
  )
}

/* ---------- header ---------- */

export function TopBar() {
  return (
    <div className="hidden bg-navy-900 text-[12.5px] text-white/80 md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2">
        <div className="flex items-center gap-5">
          <a href={AGENCY.phoneHref} className="flex items-center gap-1.5 hover:text-white">
            <Phone className="h-3.5 w-3.5 text-orange" /> {AGENCY.phone}
          </a>
          <a href={`mailto:${AGENCY.email}`} className="flex items-center gap-1.5 hover:text-white">
            <Mail className="h-3.5 w-3.5 text-orange" /> {AGENCY.email}
          </a>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-orange" /> {AGENCY.addressShort}
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-orange" /> {AGENCY.hours}
        </span>
      </div>
    </div>
  )
}

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,box-shadow] duration-300',
        scrolled || open ? 'bg-white shadow-card' : 'bg-navy',
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5">
        <a href="#home" className="flex items-center gap-2.5">
          <BrandMark size={36} />
          <span className={cn('font-display text-[17px] font-bold', scrolled || open ? 'text-navy' : 'text-white')}>
            {AGENCY.name}
          </span>
        </a>
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={cn(
                'text-[14px] font-medium transition-colors hover:text-orange',
                scrolled ? 'text-ink' : 'text-white/85',
              )}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={focusLogin}
            className="rounded-[10px] bg-orange px-4 py-2.5 text-[13px] font-semibold text-white shadow-nav transition-colors hover:bg-orange-600"
          >
            Staff login
          </button>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
            className={cn('grid h-10 w-10 place-items-center rounded-[10px] lg:hidden', scrolled || open ? 'text-navy' : 'text-white')}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-line bg-white px-5 pb-4 lg:hidden">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3 text-[14px] font-medium text-ink last:border-0"
            >
              {n.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  )
}

/* ---------- hero ---------- */

export function Hero({ loginCard }: { loginCard: ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <section id="home" className="relative overflow-hidden bg-navy pb-32 pt-12 text-white sm:pt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(60% 60% at 85% 10%, rgba(242,101,34,.28), transparent 60%), radial-gradient(50% 50% at 0% 100%, rgba(28,61,120,.9), transparent 70%), radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 22px 22px',
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/90 ring-1 ring-white/15">
              <BadgeCheck className="h-4 w-4 text-orange" /> {AGENCY.tagline}
            </span>
            <h1 className="mt-5 text-[38px] font-extrabold leading-[1.08] sm:text-[52px]">
              Clean cooking gas,
              <br />
              <span className="text-orange">delivered with care.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15.5px] text-white/75">
              {AGENCY.name} serves Naidupeta and nearby villages with Indane LPG refills, new connections and
              doorstep delivery. Staff sign in here to run the day.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-[10px] bg-orange px-5 py-3 text-[14px] font-semibold shadow-primary transition-colors hover:bg-orange-600"
              >
                Our services <ArrowRight className="h-4 w-4" />
              </a>
              <a href={AGENCY.phoneHref} className="flex items-center gap-3 text-[14px]">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-orange ring-4 ring-white/15">
                  <PhoneCall className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[12px] text-white/60">Call the office</span>
                  <span className="font-semibold">{AGENCY.phone}</span>
                </span>
              </a>
            </div>
          </motion.div>
        </div>

        <div className="relative">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mx-auto w-full max-w-[400px] lg:mr-0"
          >
            <motion.div
              className="absolute -left-48 top-20 hidden xl:block"
              animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="absolute inset-x-[-30%] top-[15%] aspect-square rounded-full bg-orange/30 blur-3xl" />
              <img
                src={PHOTOS.cylinderCutout}
                alt="Red Indane 14.2 kg domestic LPG cylinder"
                className="relative h-72 w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,.45)]"
              />
            </motion.div>
            {loginCard}
          </motion.div>
        </div>
      </div>
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[70px] w-full fill-surface sm:h-[110px]"
      >
        <path d="M0 120 V60 C240 120 480 0 720 30 C960 60 1200 110 1440 40 V120 Z" />
      </svg>
    </section>
  )
}

/* ---------- feature cards overlapping the hero ---------- */

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ReceiptText, title: 'Sales & invoices', text: 'Record every sale with its invoice number, cash, UPI and online split.' },
  { icon: PackageCheck, title: 'Purchase & returns', text: 'Log ac4 / erv loads and write off damaged or lost stock.' },
  { icon: ClipboardList, title: 'Day sheet', text: 'Close the day with opening, closing stock and hand cash.' },
  { icon: Wallet, title: 'Balances & credits', text: 'Track delivery-boy and customer balances until repaid.' },
]

export function FeatureCards() {
  return (
    <section className="relative z-10 -mt-24 px-5">
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <InView key={f.title} delay={i * 0.08}>
            <div className="group h-full rounded-xl border border-line bg-white p-6 text-center shadow-card transition-transform duration-300 hover:-translate-y-1.5">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-50 text-orange transition-colors group-hover:bg-orange group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-navy">{f.title}</h3>
              <p className="mt-2 text-[13.5px] text-muted">{f.text}</p>
            </div>
          </InView>
        ))}
      </div>
    </section>
  )
}

/* ---------- about ---------- */

export function About() {
  return (
    <section id="about" className="scroll-mt-20 px-5 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <InView>
          <div className="relative mx-auto aspect-square w-full max-w-[440px]">
            <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-navy">
              <span
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(60% 55% at 50% 45%, rgba(242,101,34,.45), transparent 70%), radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)',
                  backgroundSize: 'auto, 22px 22px',
                }}
              />
              <span className="absolute inset-x-10 bottom-10 h-6 rounded-[50%] bg-black/40 blur-xl" />
            </div>
            <div className="absolute inset-x-0 bottom-12 top-8 flex items-end justify-center">
              <img src={PHOTOS.cylinder5kgFtl} alt="" loading="lazy" className="-mr-6 h-[40%] w-auto drop-shadow-2xl" />
              <img
                src={PHOTOS.cylinderCutout}
                alt="Red Indane LPG cylinders"
                loading="lazy"
                className="relative z-10 h-[72%] w-auto drop-shadow-2xl"
              />
              <img src={PHOTOS.cylinderCutout} alt="" loading="lazy" className="-ml-8 h-[60%] w-auto drop-shadow-2xl" />
            </div>
            <div className="absolute -bottom-6 -right-2 rounded-xl bg-orange px-5 py-4 text-white shadow-primary sm:-right-6">
              <p className="font-display text-[26px] font-extrabold leading-none">Indane</p>
              <p className="mt-1 text-[12px] text-white/85">IndianOil LPG</p>
            </div>
          </div>
        </InView>
        <InView delay={0.1}>
          <Eyebrow>About us</Eyebrow>
          <h2 className="mt-2 text-[28px] font-bold leading-tight text-navy sm:text-[34px]">
            Your neighbourhood Indane distributor in Naidupeta
          </h2>
          <p className="mt-4 text-[15px] text-muted">
            {AGENCY.name} is an authorised IndianOil distributorship on Tirupati Road, near the Shirdi Sai Temple.
            From the godown to the doorstep, our team keeps homes, hotels and businesses supplied with safe,
            genuine Indane LPG.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Genuine, sealed Indane cylinders with checked weight',
              'Doorstep delivery across Naidupeta and nearby villages',
              'Help with new connections, transfers and safety checks',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[14.5px] text-ink">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange" /> {t}
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-navy px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700"
          >
            Visit the office <ArrowRight className="h-4 w-4" />
          </a>
        </InView>
      </div>
    </section>
  )
}

/* ---------- services grid ---------- */

const SERVICES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Flame, title: 'Domestic refills', text: '14.2 kg and 5 kg refills booked through Indane and delivered to your home.' },
  { icon: UserRound, title: 'New connections', text: 'Fresh domestic connections, transfers and KYC help at the office.' },
  { icon: Store, title: 'Commercial supply', text: '19 kg and 47.5 kg cylinders for hotels, shops and businesses.' },
  { icon: Truck, title: 'Doorstep delivery', text: 'Our delivery team covers Naidupeta town and surrounding villages.' },
  { icon: ShieldCheck, title: 'Safety checks', text: 'Mandatory safety inspection of the hose, regulator and stove.' },
  { icon: Plug, title: 'Accessories', text: 'Genuine regulators, Suraksha hoses and lighters at the counter.' },
]

export function Services() {
  return (
    <section id="services" className="scroll-mt-20 bg-white px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Our services" title="Everything you need for LPG, under one roof" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <InView key={s.title} delay={(i % 3) * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-xl border border-line bg-surface p-7 transition-colors duration-300 hover:border-navy hover:bg-navy">
                <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-white text-orange shadow-card">
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-[17px] font-bold text-navy transition-colors group-hover:text-white">{s.title}</h3>
                <p className="mt-2 text-[14px] text-muted transition-colors group-hover:text-white/70">{s.text}</p>
                <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-orange/10 transition-transform duration-500 group-hover:scale-[3]" />
              </div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- counters ---------- */

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(reduceMotion ? to : 0)

  useEffect(() => {
    if (!inView || reduceMotion) return
    const controls = animate(0, to, { duration: 1.4, ease: 'easeOut', onUpdate: (v) => setValue(Math.round(v)) })
    return () => controls.stop()
  }, [inView, reduceMotion, to])

  return <span ref={ref}>{value}</span>
}

const STATS: { icon: LucideIcon; value: number; suffix?: string; label: string }[] = [
  { icon: CalendarDays, value: 6, label: 'Days open every week' },
  { icon: Flame, value: 4, label: 'Cylinder sizes supplied' },
  { icon: Clock, value: 9, suffix: 'AM', label: 'Office opens, Mon – Sat' },
  { icon: PhoneCall, value: 1906, label: 'LPG emergency helpline' },
]

export function Counters() {
  return (
    <section className="relative overflow-hidden bg-navy px-5 py-16 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <InView key={s.label} className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-orange shadow-primary">
              <s.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="num font-display text-[34px] font-extrabold leading-none">
                <CountUp to={s.value} />
                {s.suffix ? <span className="ml-1 text-[18px] text-orange">{s.suffix}</span> : null}
              </p>
              <p className="mt-1.5 text-[13px] text-white/70">{s.label}</p>
            </div>
          </InView>
        ))}
      </div>
    </section>
  )
}

/* ---------- cylinders ---------- */

const CYLINDERS = [
  { size: '14.2 kg', name: 'Domestic', use: 'The standard home kitchen refill, booked through Indane.', tag: 'Most booked', shots: [{ src: PHOTOS.cylinderCutout, h: 'h-[82%]' }] },
  { size: '5 kg', name: 'FTL / Chhotu', use: 'Free-trade and easy to carry, for students and small homes.', tag: 'Portable', shots: [{ src: PHOTOS.cylinder5kgFtl, h: 'h-[62%]' }] },
  {
    size: '19 · 47.5 kg',
    name: 'Commercial',
    use: 'Hotels, tea stalls, shops and large kitchens. Xtra Tej for high-flame use.',
    tag: 'Business',
    shots: [
      { src: PHOTOS.cylinder19kgXtratej, h: 'h-[78%]' },
      { src: PHOTOS.cylinder19kg, h: 'h-[88%]' },
    ],
  },
]

export function Cylinders() {
  return (
    <section id="cylinders" className="scroll-mt-20 px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Our cylinders" title="Indane cylinders for every kitchen" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CYLINDERS.map((c, i) => (
            <InView key={c.size} delay={i * 0.08}>
              <div className="group h-full overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <div className="relative h-64 overflow-hidden bg-gradient-to-b from-orange-50 via-white to-surface">
                  <span className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange/10" />
                  <span className="absolute inset-x-1/4 bottom-5 h-4 rounded-[50%] bg-navy/25 blur-md" />
                  <div className="absolute inset-x-0 bottom-6 top-4 flex items-end justify-center">
                    {c.shots.map(({ src, h: ht }, k) => (
                      <img
                        key={src}
                        src={src}
                        alt={k === 0 ? `Indane ${c.size} ${c.name.toLowerCase()} cylinder` : ''}
                        loading="lazy"
                        className={cn(
                          ht,
                          'w-auto drop-shadow-xl transition-transform duration-500 group-hover:-translate-y-2',
                          k > 0 && '-ml-2',
                        )}
                      />
                    ))}
                  </div>
                  <span className="absolute left-4 top-4 rounded-full bg-orange px-2.5 py-1 text-[11px] font-semibold text-white shadow-primary">
                    {c.tag}
                  </span>
                </div>
                <div className="p-5">
                  <p className="font-display text-[22px] font-extrabold text-navy">{c.size}</p>
                  <p className="text-[13px] font-semibold text-orange">{c.name}</p>
                  <p className="mt-2 text-[13.5px] text-muted">{c.use}</p>
                </div>
              </div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- gallery ---------- */

const GALLERY: { icon: LucideIcon; title: string; sub: string; photo?: string; span?: string }[] = [
  { icon: Warehouse, title: 'Sealed & stacked', sub: 'Indane refills ready to go out', photo: PHOTOS.cylinderStack, span: 'lg:col-span-2 lg:row-span-2' },
  { icon: Truck, title: 'Out for delivery', sub: 'Loaded carrier on its round', photo: PHOTOS.deliveryVehicle },
  { icon: Store, title: 'Distributor outlet', sub: 'Bookings, KYC & refills', photo: PHOTOS.shopfront },
  { icon: Users, title: 'Doorstep supply', sub: 'Cylinders by cycle and van', photo: PHOTOS.distribution },
  { icon: Wrench, title: 'Safety checks', sub: 'Hose, regulator & stove' },
]

export function Gallery() {
  return (
    <section className="bg-white px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Gallery" title="From the godown to every kitchen" />
        <div className="grid auto-rows-[190px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY.map((g, i) => (
            <InView key={g.title} delay={i * 0.06} className={g.span}>
              <div className="group relative h-full overflow-hidden rounded-xl bg-gradient-to-br from-orange to-orange-600 p-6 text-white">
                {g.photo ? (
                  <>
                    <img
                      src={g.photo}
                      alt={g.sub}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/25 to-transparent" />
                  </>
                ) : (
                  <g.icon
                    aria-hidden="true"
                    className="absolute -bottom-6 -right-6 h-40 w-40 opacity-15 transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                <div className="relative flex h-full flex-col justify-end">
                  <span className="mb-3 grid h-10 w-10 place-items-center rounded-[12px] bg-white/15 backdrop-blur">
                    <g.icon className="h-5 w-5" />
                  </span>
                  <p className="font-display text-[19px] font-bold">{g.title}</p>
                  <p className="text-[13px] text-white/80">{g.sub}</p>
                </div>
              </div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- safety (video-block layout) ---------- */

const SAFETY = [
  { icon: Wind, text: 'Smell gas? Shut the regulator, open doors and windows, and keep switches off.' },
  { icon: Flame, text: 'Never light a match or use an electrical switch near a suspected leak.' },
  { icon: ShieldCheck, text: 'Keep the cylinder upright, on the floor and away from heat.' },
  { icon: Wrench, text: 'Replace the Suraksha hose every 5 years; use only ISI-marked regulators.' },
]

export function Safety() {
  return (
    <section id="safety" className="scroll-mt-20 px-5 py-20">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[24px] bg-white shadow-card lg:grid-cols-2">
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-navy p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(60% 60% at 50% 40%, rgba(242,101,34,.4), transparent 65%)' }}
          />
          <div className="relative text-center text-white">
            <span className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-orange shadow-primary">
              <span className="absolute inset-0 animate-ping rounded-full bg-orange/40 motion-reduce:animate-none" />
              <PhoneCall className="relative h-10 w-10" />
            </span>
            <p className="mt-6 text-[13px] uppercase tracking-[0.2em] text-white/70">LPG emergency · 24×7</p>
            <a href={`tel:${AGENCY.emergency}`} className="num mt-1 block font-display text-[56px] font-extrabold leading-none">
              {AGENCY.emergency}
            </a>
          </div>
        </div>
        <InView className="p-8 sm:p-10">
          <Eyebrow>Safety first</Eyebrow>
          <h2 className="mt-2 text-[26px] font-bold leading-tight text-navy sm:text-[30px]">
            Remind every customer, on every delivery
          </h2>
          <ul className="mt-6 space-y-4">
            {SAFETY.map((s) => (
              <li key={s.text} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50 text-orange">
                  <s.icon className="h-[18px] w-[18px]" />
                </span>
                <p className="pt-1.5 text-[14px] text-ink">{s.text}</p>
              </li>
            ))}
          </ul>
        </InView>
      </div>
    </section>
  )
}

/* ---------- team ---------- */

const TEAM = [
  { name: AGENCY.contactPerson, role: 'Contact person', initials: 'PS' },
  { name: 'Office desk', role: 'Bookings, KYC & billing', icon: ClipboardList },
  { name: 'Cashier', role: 'Hand cash & deposits', icon: Wallet },
  { name: 'Delivery team', role: 'Doorstep supply', icon: Truck },
]

export function Team() {
  return (
    <section className="bg-white px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Our team" title="The people who keep the gas flowing" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <InView key={m.name} delay={i * 0.08}>
              <div className="group h-full rounded-xl border border-line bg-surface p-6 text-center transition-shadow hover:shadow-card">
                <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-navy font-display text-[28px] font-bold text-white ring-4 ring-orange/20 transition-colors group-hover:bg-orange">
                  {m.icon ? <m.icon className="h-9 w-9" /> : m.initials}
                </span>
                <h3 className="mt-4 text-[16px] font-bold text-navy">{m.name}</h3>
                <p className="text-[13px] text-muted">{m.role}</p>
              </div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- updates (blog layout) ---------- */

const UPDATES = [
  { date: 'Oct 2, 2026', title: 'Invoice number is now required', text: 'Every sale needs its invoice number. A repeated number is rejected.', icon: ReceiptText },
  { date: 'Oct 2, 2026', title: 'Purchase page replaces Stock Intake', text: 'Add ac4, erv and damaged / lost returns line by line, then record all.', icon: PackageCheck },
  { date: 'Oct 2, 2026', title: 'Customer balances', text: 'The Balance page now has Delivery boys and Customers tabs with repayments.', icon: Wallet },
]

export function Updates() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="What's new in Ski" title="Latest updates for staff" />
        <div className="grid gap-5 md:grid-cols-3">
          {UPDATES.map((u, i) => (
            <InView key={u.title} delay={i * 0.08}>
              <article className="group h-full overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <div className="relative grid h-36 place-items-center bg-gradient-to-br from-navy to-navy-700">
                  <u.icon className="h-12 w-12 text-white/90 transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute bottom-0 left-5 translate-y-1/2 rounded-[8px] bg-orange px-3 py-1.5 text-[12px] font-semibold text-white shadow-primary">
                    {u.date}
                  </span>
                </div>
                <div className="p-6 pt-7">
                  <h3 className="text-[16.5px] font-bold text-navy">{u.title}</h3>
                  <p className="mt-2 text-[13.5px] text-muted">{u.text}</p>
                </div>
              </article>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- footer ---------- */

export function Footer() {
  return (
    <footer id="contact" className="scroll-mt-20 bg-navy-900 px-5 pt-16 text-white/75">
      <div className="mx-auto grid max-w-6xl gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.2fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark size={38} />
            <span className="font-display text-[18px] font-bold text-white">{AGENCY.name}</span>
          </div>
          <p className="mt-4 text-[13.5px]">
            {AGENCY.tagline}, serving Naidupeta and surrounding villages in Nellore district.
          </p>
          <button
            type="button"
            onClick={focusLogin}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-orange px-4 py-2.5 text-[13px] font-semibold text-white shadow-nav hover:bg-orange-600"
          >
            Staff login <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div>
          <h4 className="font-display text-[16px] font-bold text-white">Quick links</h4>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            {NAV.slice(1).map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-orange">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-display text-[16px] font-bold text-white">Our contact</h4>
          <ul className="mt-4 space-y-3 text-[13.5px]">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
              <a href={AGENCY.mapsHref} target="_blank" rel="noreferrer" className="hover:text-white">
                {AGENCY.addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
              <a href={AGENCY.phoneHref} className="hover:text-white">
                {AGENCY.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
              <a href={`mailto:${AGENCY.email}`} className="break-all hover:text-white">
                {AGENCY.email}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-[16px] font-bold text-white">Office hours</h4>
          <p className="mt-4 text-[13.5px]">{AGENCY.hours}</p>
          <p className="text-[13.5px]">{AGENCY.closed}</p>
          <p className="mt-4 rounded-[10px] bg-white/5 px-3 py-2.5 text-[13px] ring-1 ring-white/10">
            Gas leak? Call <span className="font-bold text-orange">{AGENCY.emergency}</span> any time.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 py-5 text-[12.5px] sm:flex-row">
          <p>© {new Date().getFullYear()} {AGENCY.name}. All rights reserved.</p>
          <p>Operations dashboard · Ski</p>
        </div>
        <details className="mx-auto max-w-6xl pb-5 text-[11.5px] text-white/50">
          <summary className="cursor-pointer hover:text-white/80">Photo credits (Wikimedia Commons)</summary>
          <ul className="mt-2 space-y-1">
            {PHOTO_CREDITS.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noreferrer" className="underline hover:text-white">
                  {c.title}
                </a>{' '}
                by {c.author},{' '}
                <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">
                  {c.license}
                </a>
                , {c.note}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </footer>
  )
}
