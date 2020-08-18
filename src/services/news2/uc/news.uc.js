const { newsPermissions } = require('../repo/db/news.schema');
const NewsRepo = require('../repo/news.repo');

module.exports = class NewsUc {
	constructor(app) {
		this.newsRepo = new NewsRepo();
		// 1 Could be also achieved with mixins!
		this.scopeUc = app.service('scopeUc');
	}

	/**
	 * Decorates a result or result set with handy short-hands for the API-consumer
	 * @static
	 * @param {News|Array<News>|Object} result a news item or collection of news items
	 * @returns {News|Array<News>|Object} decorated result(s)
	 * @memberof NewsService
	 */
	static decorateResults(result) {
		const decorate = (n) => ({
			...n,
			school: n.schoolId,
			schoolId: (n.schoolId || {})._id,
			creator: n.creatorId,
			creatorId: (n.creatorId || {})._id,
			updater: n.updaterId,
			updaterId: (n.updaterId || {})._id,
		});
		if (result instanceof Array) {
			return result.map(decorate);
		}
		if (result.data) { // paginated result set
			const dataIdsFixed = result.data.map(decorate);
			return { ...result, data: dataIdsFixed };
		}
		return decorate(result);
	}

	/**
	 * Decorates a result set with the user's permissions for each news item in the set
	 * @param {Object} result result set
	 * @param {ObjectId} userId the user's id
	 * @returns {Object} decorated result set
	 * @memberof NewsService
	 */
	async decoratePermissions(result, userId) {
		const decorate = async (n) => ({
			...n,
			permissions: await this.scopeUc.getPermissions(userId, {
				target: (n.target || {})._id,
				targetModel: n.targetModel,
				schoolId: n.schoolId,
			}),
		});

		if (result instanceof Array) {
			return Promise.all(result.map(decorate));
		}
		if (result.data) { // paginated result set
			const decoratedData = await Promise.all(result.data.map(decorate));
			return { ...result, data: decoratedData };
		}
		return decorate(result);
	}

	async createNews(news, account) {
		// authorize
		await this.scopeUc.authorize(news, account.userId, newsPermissions.CREATE);
		// uniquness check?
		const newNewsData = {
			...news,
			creatorId: account.userId,
			updaterId: null,
		};
		return this.newsRepo.createNews(newNewsData);
	}

	async readNews(id, account) {
		const news = await this.newsRepo.readNews(id);

		const now = Date.now();
		if (news.displayAt > now) {
			await this.scopeUc.authorize(news, account.userId, newsPermissions.EDIT);
		} else {
			await this.scopeUc.authorize(news, account.userId, newsPermissions.VIEW);
		}

		news.permissions = await this.scopeUc.getPermissions(account.userId, news);
		return NewsUc.decorateResults(news);
	}

	async findNews(searchParams, account) {
		const permission = searchParams.unpublished ? newsPermissions.EDIT : newsPermissions.VIEW;
		const scopeParams = await this.scopeUc.buildScopeParams(searchParams, account, permission);

		return this.newsRepo.searchForNews(searchParams, scopeParams)
			.then(NewsUc.decorateResults)
			.then((result) => this.decoratePermissions(result, account.userId));
	}
};
