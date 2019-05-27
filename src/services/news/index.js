const service = require('feathers-mongoose');
const { newsModel, newsHistoryModel } = require('./model');
const hooks = require('./hooks');

const flatten = arr => arr.reduce((agg, el) => {
	if (el instanceof Array) {
		return agg.concat(flatten(el));
	}
	return agg.concat(el);
}, []);

const paginate = (data, params) => {
	if (params.paginate === false) {
		return data;
	}
	const limit = params.$limit || data.length;
	const skip = params.$skip || 0;
	const paginatedData = data.slice(skip, skip + limit);
	return {
		total: data.length,
		limit,
		skip,
		data: paginatedData,
	};
};

class NewsService {
	setup(app) {
		this.app = app;
	}

	async findSchoolNews({ userId, schoolId }) {
		const user = await this.app.service('users').get(userId);
		const hasAccess = user.permissions.includes('NEWS_VIEW');
		if (!hasAccess) {
			throw new Error('Mising permissions to view school news.');
		}
		return newsModel.find({	schoolId });
	}

	async findScopedNews(userId) {
		const scopes = await newsModel.distinct('targetModel');
		const ops = scopes.map(async (scope) => {
			const scopeListService = this.app.service(`/users/:scopeId/${scope}`);
			if (scopeListService === undefined) {
				throw new Error(`Missing ScopeListService for scope "${scope}".`);
			}
			const scopeItems = await scopeListService.find({
				route: { scopeId: userId.toString() },
				query: { permissions: ['NEWS_VIEW'] },
			});
			return Promise.all(scopeItems.map(async (item) => {
				const news = await newsModel.find({
					targetModel: scope,
					target: item._id,
				}).lean();
				return Promise.all(news.map(async n => ({
					...n,
					target: await this.app.service(scope).get(n.target),
				})));
			}));
		});
		const results = await Promise.all(ops);
		return flatten(results);
	}

	/**
	 * GET /news/
	 * Returns all news the user can see.
	 * @param {*} params
	 * @returns array of news items
	 * @memberof NewsService
	 */
	async find(params) {
		let news = [];
		news = news.concat(await this.findSchoolNews(params.account));
		news = news.concat(await this.findScopedNews(params.account.userId));
		return Promise.resolve(paginate(news, params));
	}
}

module.exports = function news() {
	const app = this;
	const newsService = new NewsService();
	app.use('/news', newsService);
	app.service('news').hooks(hooks);

	app.use('/newshistory', service({
		Model: newsHistoryModel,
	}));
	const newsHistoryService = app.service('/newshistory');
	newsHistoryService.hooks(hooks);
};
