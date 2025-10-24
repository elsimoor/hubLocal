"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import {
	Sparkles, LayoutTemplate, Search, Palette, Rocket, Link2,
	LogIn, LogOut, ArrowRight
} from "lucide-react";

// Import the theme context to allow toggling between themes
import { useTheme } from "./theme-provider";

function AmbientFX() {
	return (
		<>
			<div
				className="pointer-events-none fixed inset-0 -z-10 opacity-[.35]
        [background:linear-gradient(transparent_23px,rgba(0,0,0,.035)_24px),linear-gradient(90deg,transparent_23px,rgba(0,0,0,.035)_24px)]
        [background-size:24px_24px]"
			/>
			<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl animate-float" />
				<div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl animate-float" />
				<div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl animate-float" />
			</div>
		</>
	);
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
	const ref = useRef<HTMLDivElement | null>(null);
	const [v, setV] = useState(false);
	useEffect(() => {
		const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.14 });
		if (ref.current) io.observe(ref.current);
		return () => io.disconnect();
	}, []);
	return (
		<div
			ref={ref}
			style={{ transitionDelay: `${delay}ms` }}
			className={`transition-all duration-700 will-change-transform ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
		>
			{children}
		</div>
	);
}

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<div className="p-[2px] rounded-2xl bg-[conic-gradient(from_180deg,rgba(255,255,255,.45),rgba(255,255,255,.15),rgba(255,255,255,.45))]">
			<div className={`rounded-2xl border border-white/60 bg-white/60 backdrop-blur ${className}`}>
				{children}
			</div>
		</div>
	);
}

/* ================= Navbar ================= */
function Navbar() {
	const { data: session } = useSession();
	// Access the current theme and setter
	const { theme, setTheme } = useTheme();

	// Cycle through themes: light -> dark -> colorful -> back to light
	const cycleTheme = () => {
		const order: Array<typeof theme> = ["light", "dark", "colorful"];
		const idx = order.indexOf(theme as any);
		const next = order[(idx + 1) % order.length];
		setTheme(next as any);
	};
	return (
		<header className="fixed top-0 inset-x-0 z-50">
			<div className="mx-auto max-w-6xl px-4 py-3">
				<div className="rounded-2xl border border-white/30 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/45 shadow-[0_8px_30px_rgba(0,0,0,.06)]">
					<nav className="flex items-center justify-between px-4 py-2">
						<div className="flex items-center gap-2">
							<div className="h-8 w-8 grid place-items-center rounded-xl border border-white/70 bg-white">
								<Sparkles size={16} className="text-gray-700" />
							</div>
							<span className="font-semibold tracking-wide text-gray-800">HubLocal</span>
						</div>
						<ul className="hidden md:flex items-center gap-6 text-sm text-gray-700">
							<li><a href="#concept" className="hover:text-gray-900">Concept</a></li>
							<li><a href="#features" className="hover:text-gray-900">Fonctionnalités</a></li>
							<li><a href="#showcase" className="hover:text-gray-900">Showcase</a></li>
							<li><a href="#seo" className="hover:text-gray-900">SEO</a></li>
						</ul>
						<div className="flex items-center gap-2">
            {/* Theme toggle button: cycles through light/dark/colorful themes */}
            <button
              onClick={cycleTheme}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-transparent hover:bg-white/70"
              title="Changer le thème"
            >
              {/* Use the Palette icon to represent theme selection */}
              <Palette size={18} />
            </button>
							{!session ? (
								<>
									<button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-3 py-1.5 text-sm hover:opacity-95">
										<LogIn size={14} /> Commencer
									</button>
								</>
							) : (
								<>
									<Link href="/dashboard" className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50">
										Dashboard <ArrowRight size={14} />
									</Link>
									<button onClick={() => signOut({ callbackUrl: "/" })} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-3 py-1.5 text-sm hover:opacity-95">
										<LogOut size={14} /> Se déconnecter
									</button>
								</>
							)}
						</div>
					</nav>
				</div>
			</div>
		</header>
	);
}

function Hero() {
	const { data: session } = useSession();
	const heroSrc = "https://picsum.photos/seed/hublocal-hero/1920/1080";

	return (
		<section className="pt-28">
			<div className="mx-auto max-w-6xl px-4">
				<Reveal>
					<Glass>
						<div className="relative rounded-2xl overflow-hidden">
							<div className="relative w-full aspect-[16/9]">
								<Image src={heroSrc} alt="Hero" fill className="object-cover select-none" priority />
								<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,.18))]" />
							</div>

							<div className="absolute inset-0 px-6 md:px-10 flex items-center justify-center">
								<div className="max-w-xl text-center text-white drop-shadow-[0_6px_30px_rgba(0,0,0,.35)]">
									<p className="text-xs uppercase tracking-[.3em] text-white/80">AU-DELÀ DES LIENS</p>
									<h1 className="mt-2 text-3xl md:text-4xl font-semibold leading-tight">
										Ton <span className="text-white/90">hub de liens</span> brandé & performant.
									</h1>
									<p className="mt-3 text-sm text-white/80">
										Pas un site. Une page unique, élégante, SEO-first, avec tout ce qui compte.
									</p>

									<div className="mt-5 flex flex-wrap gap-2 justify-center">
										{!session ? (
											<>
												<button
													onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
													className="inline-flex items-center gap-2 rounded-xl border duration-200 border-white/60 bg-white/85 backdrop-blur px-4 py-2 text-sm text-gray-900 hover:bg-white"
												>
													<span className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] border border-gray-200 bg-white">
														<svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
															<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.6 18.9 13.9 24 13.9c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 16.1 4 9.3 8.4 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.3l-6.2-5.1c-2 1.4-4.6 2.4-7.2 2.4-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.1 39.6 16 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-3.7 5.9-7 7.2l6.2 5.1C36.1 41.7 40 38 42.3 33.3c1.1-2.4 1.7-5.1 1.7-8.3 0-1.2-.1-2.3-.4-3.5z" />
														</svg>
													</span>
													Continuer avec Google
												</button>
											</>
										) : (
											<Link
												href="/dashboard"
												className="inline-flex items-center duration-200 gap-2 rounded-xl border border-white/60 bg-white/85 backdrop-blur px-4 py-2 text-sm text-gray-900 hover:bg-white"
											>
												Ouvrir le dashboard
											</Link>
										)}
									</div>
								</div>
							</div>

							<div className="absolute top-3 left-1/2 -translate-x-1/2 h-6 px-4 rounded-full bg-black/10 backdrop-blur text-[11px] tracking-[0.3em] text-white/80 flex items-center">
								H U B L O C A L
							</div>
						</div>
					</Glass>
				</Reveal>
			</div>
		</section>
	);
}

/* ================= Sections ================= */
function SectionTitle({ k, title, subtitle }: { k: string; title: string; subtitle: string }) {
	return (
		<div id={k} className="text-center">
			<h2 className="text-2xl md:text-3xl font-semibold text-gray-900">{title}</h2>
			<p className="mt-2 text-sm text-gray-600">{subtitle}</p>
		</div>
	);
}

function Concept() {
	return (
		<section className="py-14" id="concept">
			<div className="mx-auto max-w-6xl px-4 space-y-8">
				<Reveal><SectionTitle k="concept" title="Le Linktree repensé" subtitle="Même simplicité. Enfin pro : design fidèle à ta marque + perf + SEO." /></Reveal>
				<div className="grid md:grid-cols-3 gap-3">
					{[
						{ h: "Une page, une identité", p: "Couleurs, polices, arrondis : ta charte, pas la nôtre." },
						{ h: "Slugs & shortlinks", p: "Ex. /people/matteo-lafraise + hublocal.link/slug personnalisable." },
						{ h: "Bêta : pages illimitées", p: "Pendant la bêta, aucune limite sur le nombre de pages." },
					].map((b, idx) => (
						<Reveal key={b.h} delay={80 * idx}>
							<Glass>
								<div className="p-5 rounded-2xl">
									<h4 className="text-sm font-semibold text-gray-900">{b.h}</h4>
									<p className="mt-1 text-sm text-gray-600">{b.p}</p>
								</div>
							</Glass>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}

function Features() {
	const items = [
		{ icon: <LayoutTemplate size={18} />, title: "Builder modulaire", text: "Blocs liens, CTA, réseaux, vidéo, formulaire…" },
		{ icon: <Palette size={18} />, title: "Charte respectée", text: "Thèmes & tokens pour coller à ta marque." },
		{ icon: <Search size={18} />, title: "SEO natif", text: "SSR/SSG, balises méta, OpenGraph, sitemap auto." },
		{ icon: <Rocket size={18} />, title: "Rapide & scalable", text: "Next.js + CDN. Temps d'affichage instantané." },
	];
	return (
		<section className="py-14" id="features">
			<div className="mx-auto max-w-6xl px-4 space-y-8">
				<Reveal><SectionTitle k="features" title="Pensé pour le branding & la performance" subtitle="Crée en minutes un hub de liens qui te ressemble." /></Reveal>
				<div className="grid md:grid-cols-4 gap-3">
					{items.map((it, idx) => (
						<Reveal key={it.title} delay={80 * idx}>
							<Glass>
								<div className="p-4 rounded-2xl">
									<div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white text-gray-800">
										{it.icon}
									</div>
									<h3 className="mt-3 text-sm font-semibold text-gray-900">{it.title}</h3>
									<p className="mt-1 text-sm text-gray-600">{it.text}</p>
								</div>
							</Glass>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}

function Showcase() {
	const seeds = ["editor-1", "editor-2", "profile-1", "profile-2", "analytics-1", "templates-1"];
	const imgs = seeds.map((s) => ({
		src: `https://picsum.photos/seed/${encodeURIComponent(s)}/1920/1080`,
		alt: s.replace("-", " "),
	}));

	const scRef = useRef<HTMLDivElement | null>(null);
	const [i, setI] = useState(0);

	const go = (dir: number) => {
		const next = (i + dir + imgs.length) % imgs.length;
		setI(next);
		const el = scRef.current?.children[next] as HTMLElement | undefined;
		if (el && scRef.current) {
			const left = el.offsetLeft - scRef.current.clientLeft - 12;
			scRef.current.scrollTo({ left, behavior: "smooth" });
		}
	};
	return (
		<section id="showcase" className="py-14">
			<div className="mx-auto max-w-6xl px-4 space-y-6">
				<Reveal><SectionTitle k="showcase" title="Aperçu de l'éditeur & des pages" subtitle="Un aperçu rapide de l'expérience HubLocal." /></Reveal>
				<div className="relative">
					<div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r  to-transparent rounded-l-2xl" />
					<div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l  to-transparent rounded-r-2xl" />
					<div ref={scRef} className="flex gap-3 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						{imgs.map((img, idx) => (
							<Reveal key={img.src} delay={60 * idx}>
								<div className="shrink-0 snap-center">
									<Glass>
										<figure className="relative w-[82vw] sm:w-[560px] h-[320px] rounded-2xl overflow-hidden">
											<Image src={img.src} alt={img.alt} fill className="object-cover select-none" />
											<figcaption className="absolute left-0 right-0 bottom-0 p-3 text-[12px] text-gray-800 bg-white/70 backdrop-blur border-t border-white/70">
												{img.alt}
											</figcaption>
											<div className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-white/80 border border-white/70 text-gray-700">
												{idx + 1}/{imgs.length}
											</div>
										</figure>
									</Glass>
								</div>
							</Reveal>
						))}
					</div>
					<div className="mt-3 flex items-center justify-center gap-2">
						<button onClick={() => go(-1)} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">Précédent</button>
						<button onClick={() => go(1)} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">Suivant</button>
					</div>
				</div>
				<Reveal delay={150}>
					<div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-600">
						<Glass><div className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5"><Link2 size={12} /> URL publique : <code className="ml-1 font-mono text-gray-800">/people/matteo-lafraise</code></div></Glass>
						<Glass><div className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5"><Link2 size={12} /> Shortlink : <code className="ml-1 font-mono text-gray-800">hublocal.link/slug</code></div></Glass>
					</div>
				</Reveal>
			</div>
		</section>
	);
}

function SeoBlock() {
	return (
		<section id="seo" className="py-14">
			<div className="mx-auto max-w-6xl px-4">
				<Reveal>
					<Glass>
						<div className="p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center gap-6">
							<div className="flex-1">
								<h3 className="text-xl font-semibold text-gray-900">Construit pour le référencement</h3>
								<p className="mt-2 text-sm text-gray-600">Pages statiques, méta propres, perf top. Ton HubLocal peut réellement ranker.</p>
							</div>
							<div className="flex gap-2">
								<div className="rounded-xl border border-white/70 bg-white px-4 py-2 text-sm">Sitemap auto</div>
								<div className="rounded-xl border border-white/70 bg-white px-4 py-2 text-sm">OpenGraph</div>
								<div className="rounded-xl border border-white/70 bg-white px-4 py-2 text-sm">SSG/ISR</div>
							</div>
						</div>
					</Glass>
				</Reveal>
			</div>
		</section>
	);
}

function CTA() {
	const { data: session } = useSession();
	return (
		<section className="py-16">
			<div className="mx-auto max-w-6xl px-4">
				<Reveal>
					<Glass>
						<div className="p-6 md:p-8 rounded-2xl text-center">
							<h3 className="text-2xl font-semibold text-gray-900">Prêt à lancer ton HubLocal ?</h3>
							<p className="mt-2 text-sm text-gray-600">
								Crée, personnalise et publie en quelques minutes. <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5">Bêta : pages illimitées</span>
							</p>
							<div className="mt-5 flex gap-2 justify-center">
								{!session ? (
									<>
										<button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm hover:opacity-95">
											<LogIn size={16} /> Commencer maintenant
										</button>
									</>
								) : (
									<Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm hover:opacity-95">
										Ouvrir le dashboard <ArrowRight size={16} />
									</Link>
								)}
							</div>
						</div>
					</Glass>
				</Reveal>
			</div>
		</section>
	);
}

/* ================= Page ================= */
export default function Page() {
	return (
		<main className="min-h-[100dvh] bg-[radial-gradient(1200px_500px_at_20%_-10%,rgba(99,102,241,0.12),transparent),radial-gradient(800px_400px_at_95%_10%,rgba(16,185,129,0.10),transparent)]">
			<AmbientFX />
			<Navbar />
			<Hero />
			<Concept />
			<Features />
			<Showcase />
			<SeoBlock />
			<CTA />
			<footer className="py-10 text-center text-xs text-gray-500">
				© {new Date().getFullYear()} HubLocal - Tous droits réservés.
			</footer>
		</main>
	);
}
