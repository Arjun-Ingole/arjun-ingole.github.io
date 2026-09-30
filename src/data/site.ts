// Everything personal lives here — edit this file, not the components.

export const site = {
	name: 'Arjun Ingole',
	handle: 'dunkedtoast',
	title: 'Arjun Ingole — software engineer',
	description:
		"founding engineer at pazy. college dropout from a village near nagpur who learned to code building custom roms, now working across product, design, engineering and sales.",
	email: 'arjun0ingole@gmail.com',
	city: 'bengaluru',
	timezone: 'Asia/Kolkata',
	tzLabel: 'IST',
	githubUser: 'Arjun-Ingole',
};

// live "now playing" via last.fm (spotify scrobbles into it).
// fill both in to switch the widget on. last.fm api keys are read-only,
// so it's fine for this one to live in client code.
export const lastfm = {
	user: 'dunkedtoast',
	apiKey: '0add65bbc6bd24c254d75976341a248b',
};

export const links = {
	github: 'https://github.com/Arjun-Ingole',
	x: 'https://x.com/dunkedtoast',
	linkedin: 'https://www.linkedin.com/in/arjuningole/',
	email: `mailto:${site.email}`,
};

export type Tech =
	| 'go' | 'ts' | 'js' | 'rust' | 'postgres' | 'bun' | 'flutter' | 'dart'
	| 'kotlin' | 'python' | 'vue' | 'chrome' | 'bash' | 'android' | 'firebase'
	| 'node' | 'macos' | 'astro' | 'c';

export interface WorkItem {
	company: string;
	role: string;
	href?: string;
	period: string;
	current?: boolean;
}

export const work: WorkItem[] = [
	{
		company: 'Pazy',
		role: 'Founding Engineer',
		href: 'https://www.pazy.io/',
		period: '2024 — now',
		current: true,
	},
	{
		company: 'May4 Automation',
		role: 'Software Engineer',
		period: '2023 — 2024',
	},
];

export interface Project {
	name: string;
	blurb: string;
	href: string;
	tech: Tech[];
	stars?: number;
}

export const projects: Project[] = [
	{
		name: 'occu',
		blurb: 'computer use for opencode, as a macOS MCP server',
		href: 'https://github.com/Arjun-Ingole/occu',
		tech: ['ts', 'bun', 'macos'],
	},
	{
		name: 'sift',
		blurb: 'catches undefined property access in plain JS backends',
		href: 'https://github.com/Arjun-Ingole/sift',
		tech: ['rust', 'node'],
	},
	{
		name: 'baymax',
		blurb: 'audits the “always allow” permissions in your coding agents',
		href: 'https://arjun-ingole.github.io/baymax/',
		tech: ['ts', 'node'],
	},
	{
		name: 'vue-doctor',
		blurb: 'health checks for Vue and Nuxt apps',
		href: 'https://github.com/Arjun-Ingole/vue-doctor',
		tech: ['ts', 'vue'],
	},
	{
		name: 'chisel',
		blurb: 'hides hinge screenshots from your timeline',
		href: 'https://github.com/Arjun-Ingole/chisel',
		tech: ['js', 'chrome'],
	},
	{
		name: 'cache-proxy',
		blurb: 'a toy caching proxy server',
		href: 'https://github.com/Arjun-Ingole/cache-proxy',
		tech: ['go'],
		stars: 11,
	},
	{
		name: 'grok-codex',
		blurb: 'your codex subscription, inside the grok cli',
		href: 'https://github.com/Arjun-Ingole/grok-codex',
		tech: ['bash'],
	},
];

// the flutter / android era
export const earlier: Project[] = [
	{ name: 'osiris', blurb: 'movie and show tracker, 43 stars and counting', href: 'https://osiris-tracker.vercel.app', tech: ['flutter', 'firebase'] },
	{ name: 'hydrogen', blurb: 'custom kernel for snapdragon 720G xiaomi phones', href: 'https://github.com/Arjun-Ingole/kernel_xiaomi_sm6250', tech: ['c', 'android'] },
	{ name: 'uranus', blurb: 'anime radio client for listen.moe', href: 'https://github.com/Arjun-Ingole/Uranus', tech: ['flutter'] },
	{ name: 'gpt-3.kt', blurb: 'an android GPT-3 playground, before chatgpt was a thing', href: 'https://github.com/Arjun-Ingole/GPT-3.kt', tech: ['kotlin', 'android'] },
	{ name: 'realtime-ascii', blurb: 'your webcam, live in the terminal, as ascii', href: 'https://github.com/Arjun-Ingole/RealTime_ASCII', tech: ['python'] },
];
