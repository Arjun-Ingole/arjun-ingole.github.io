// Blog posts are plain markdown files in src/pages/blog — drop a new .md in there
// (with the BlogPostLayout frontmatter) and it shows up everywhere automatically.

export interface Post {
	title: string;
	description?: string;
	date: Date;
	readTime?: string;
	category?: string;
	url: string;
}

interface Frontmatter {
	title: string;
	description?: string;
	date: string;
	readTime?: string;
	category?: string;
	draft?: boolean;
}

const modules = import.meta.glob<{ frontmatter: Frontmatter; url: string }>('../pages/blog/*.{md,mdx}', { eager: true });

// computed lazily: post pages import this module too, so reading frontmatter at
// module-eval time would hit a circular-import TDZ error
export const getPosts = (): Post[] => Object.values(modules)
	.filter((m) => !m.frontmatter.draft)
	.map((m) => ({
		title: m.frontmatter.title,
		description: m.frontmatter.description,
		date: new Date(m.frontmatter.date),
		readTime: m.frontmatter.readTime,
		category: m.frontmatter.category,
		url: m.url,
	}))
	.sort((a, b) => b.date.getTime() - a.date.getTime());

export const fmtDate = (d: Date, style: 'short' | 'long' = 'short') =>
	d.toLocaleDateString('en-US', style === 'short'
		? { month: 'short', day: '2-digit', year: 'numeric' }
		: { month: 'long', day: 'numeric', year: 'numeric' });
