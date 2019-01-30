const service = require('feathers-mongoose');
const Parser = require('rss-parser');
const { newsModel, newsHistoryModel } = require('./model');
const hooks = require('./hooks');

const parser = new Parser();

class RSSService {
	constructor(app) {
		this.app = app;
	}

	async find(params = {}) {
		if (!params.query || !params.query.url) return {};

		const { url } = params.query;
		const rssResult = await parser.parseURL(url);
		const item = rssResult.items.find(el => el.guid === url);

		if (!item) return {};

		return {
			url: encodeURIComponent(item.guid),
			createdAt: item.isoDate,
			displayAt: item.isoDate,
			type: 'rss',
			content: item.content,
			title: item.title,
		};
	}
}

module.exports = function news() {
	const app = this;

	app.use('/news-rss', new RSSService());
	const RSSNewsService = app.service('/news-rss');
	RSSNewsService.before(hooks.rssBefore);

	app.use('/news', service({
		Model: newsModel,
		paginate: {
			default: 25,
			max: 100,
		},
	}));
	const NewsService = app.service('/news');
	NewsService.before(hooks.before);
	NewsService.after(hooks.after);

	app.use('/newshistory', service({
		Model: newsHistoryModel,
	}));
	const NewsHistoryService = app.service('/newshistory');
	NewsHistoryService.before(hooks.before);
	NewsHistoryService.after(hooks.after);
};
