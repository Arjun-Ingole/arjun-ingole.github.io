import rss from '@astrojs/rss';
import { getPosts } from '../lib/posts';
import { site } from '../data/site';

export function GET(context) {
	return rss({
		title: `${site.name} — writing`,
		description: 'notes on databases, systems, and whatever i broke this week.',
		site: context.site,
		items: getPosts().map((p) => ({
			title: p.title,
			description: p.description,
			pubDate: p.date,
			link: p.url,
		})),
	});
}
