const service = require('feathers-mongoose');
const { Forbidden, NotFound } = require('@feathersjs/errors');
const logger = require('winston');
const { newsModel, newsHistoryModel } = require('./model');
const hooks = require('./hooks');
const newsModelHooks = require('./hooks/model');
const { flatten, paginate } = require('../../utils/array');

class NewsService {
	setup(app) {
		this.app = app;
	}

	/**
	 * Checks scoped permission for a user.
	 * @param {BsonId|String} userId
	 * @param {String} permission
	 * @param {BsonId|String} targetId (optional) news target (scope) id. Only valid with targetModel.
	 * @param {String} targetModel (optional) news target (scope) model. Only valid with target.
	 * @returns {Promise<Boolean>} Promise that resolves to true/false
	 * @example
	 * await hasPermission(user._id, 'NEWS_VIEW') => true
	 * await hasPermission(user._id, 'NEWS_CREATE', team._id, 'teams') => false
	 * @memberof NewsService
	 */
	async hasPermission(userId, permission, targetId, targetModel) {
		if (targetId && targetModel) {
			const scope = this.app.service(`${targetModel}/:scopeId/userPermissions/`);
			const params = { route: { scopeId: targetId.toString() } };
			const scopePermissions = await scope.get(userId, params) || [];
			return scopePermissions.includes(permission);
		}
		const user = await this.app.service('users').get(userId);
		return user.permissions.includes(permission);
	}

	/**
	 * Throw an error if the user is not allowed to perform the given operation
	 * @param {News} news news item (required: {schoolId}, optional: {target, targetModel})
	 * @param {Object} { userId, schoolId }
	 * @param {String} permission permision to check
	 * @returns undefined
	 * @example
	 * await authorize(news, params.account, 'NEWS_VIEW') => undefined
	 * await authorize(news, params.account, 'NEWS_CREATE') => (throws Forbidden)
	 * @memberof NewsService
	 */
	async authorize(news = {}, { userId, schoolId } = {}, permission) {
		const authorized = await this.hasPermission(userId, permission, news.target, news.targetModel);
		const sameSchool = news.schoolId.toString() === schoolId.toString();
		if (!authorized || !sameSchool) {
			throw new Forbidden('Not authorized.');
		}
	}

	checkExistence(news, query) {
		if (!news) {
			logger.error(`Cannot find news item with query "${query}" => "${news}"`);
			throw new NotFound('News item does not exist.');
		}
	}

	/**
	 * Returns all school news the user is allowed to see.
	 * @param {Object} { userId, schoolId } -- The user's Id and schoolId
	 * @returns Array<News Document>
	 * @memberof NewsService
	 */
	async findSchoolNews({ userId, schoolId }) {
		if (!this.hasPermission(userId, 'NEWS_VIEW')) {
			throw new Forbidden('Mising permissions to view school news.');
		}
		const query = {	schoolId, target: { $exists: false } };
		return this.app.service('newsModel').find({ query, paginate: false });
	}

	/**
	 * Returns scoped news the user is allowed to see
	 *
	 * @param {BsonId|String} userId the user's Id
	 * @param {BsonId|String} target (optional) Id of the news target (course, team, etc.)
	 * @returns Array<News Document>
	 * @memberof NewsService
	 */
	async findScopedNews(userId, target) {
		const scopes = await newsModel.distinct('targetModel');
		const ops = scopes.map(async (scope) => {
			// For each possible target model, find all targets the user has NEWS_VIEW permissions in.
			const scopeListService = this.app.service(`/users/:scopeId/${scope}`);
			if (scopeListService === undefined) {
				throw new Error(`Missing ScopeListService for scope "${scope}".`);
			}
			let scopeItems = await scopeListService.find({
				route: { scopeId: userId.toString() },
				query: { permissions: ['NEWS_VIEW'] },
			});
			if (target) {
				// if a target id is given, only return news from this target
				scopeItems = scopeItems.filter(i => i._id.toString() === target.toString());
			}
			return Promise.all(scopeItems.map(async (item) => {
				const query = {
					targetModel: scope,
					target: item._id,
					$populate: target,
				};
				const news = await this.app.service('newsModel').find({ query, paginate: false });
				// Manually populate the target (current API requires this):
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
	 * GET /news/{id}
	 * Returns the news item specified by id
	 * @param {BsonId|String} id
	 * @param {Object} params
	 * @returns one news item
	 * @throws {Forbidden} if not authorized
	 * @throws {NotFound} if the id does not belong to a news object
	 * @memberof NewsService
	 */
	async get(id, params) {
		const news = await this.app.service('newsModel').get(id);
		this.checkExistence(news, id);
		await this.authorize(news, params.account, 'NEWS_VIEW');
		return news;
	}

	/**
	 * GET /news/
	 * Returns all news the user can see.
	 * @param {Object} params
	 * @returns paginated array of news items
	 * @memberof NewsService
	 */
	async find(params) {
		let news = [];
		const scoped = params.query && params.query.target;
		if (scoped) {
			news = news.concat(await this.findScopedNews(params.account.userId, params.query.target));
		} else {
			news = news.concat(await this.findSchoolNews(params.account));
			news = news.concat(await this.findScopedNews(params.account.userId));
		}
		return Promise.resolve(paginate(news, { params, paginate: true }));
	}

	/**
	 * POST /news/
	 * Creates a news item
	 * @param {Object} data @see NewsModel
	 * @param {Object} params
	 * @returns {News} the created news object
	 * @throws {Forbidden} if not authorized
	 * @memberof NewsService
	 */
	async create(data, params) {
		await this.authorize(data, params.account, 'NEWS_CREATE');
		return this.app.service('newsModel').create(data);
	}

	/**
	 * DELETE /news/{id}
	 * Deletes a single news item.
	 * @param {BsonId|String} id The news item's Id
	 * @param {Object} params Note that params.query won't work here
	 * @returns {News} the deleted news item
	 * @throws {Forbidden} if not authorized
	 * @throws {NotFound} if the id does not belong to a news object
	 * @memberof NewsService
	 */
	async remove(id, params) {
		const news = await this.app.service('newsModel').get(id);
		this.checkExistence(news, id);
		await this.authorize(news, params.account, 'NEWS_CREATE');
		await this.app.service('newsModel').remove(id);
		return news;
	}

	/**
	 * PUT /news/{id}
	 * Replaces a single news item
	 * @param {BsonId|String} id The news item's Id
	 * @param {News} data updated news item
	 * @param {Object} params Feathers request params (note that using params.query won't work here)
	 * @returns {News} updated news item
	 * @throws {Forbidden} if not authorized
	 * @throws {NotFound} if the id does not belong to a news object
	 * @memberof NewsService
	 */
	async update(id, data, params) {
		const news = await this.app.service('newsModel').get(id);
		this.checkExistence(news, id);
		await this.authorize(news, params.account, 'NEWS_EDIT');
		return this.app.service('newsModel').update(id, data);
	}

	/**
	 * PATCH /news/{id}
	 * Patches a single news item
	 * @param {BsonId|String} id The news item's Id
	 * @param {Object} data object containing updated news item attributes
	 * @param {Object} params Feathers request params (note that using params.query won't work here)
	 * @returns {News} patched news item
	 * @throws {Forbidden} if not authorized
	 * @throws {NotFound} if the id does not belong to a news object
	 * @memberof NewsService
	 */
	async patch(id, data, params) {
		const news = await this.app.service('newsModel').get(id);
		this.checkExistence(news, id);
		await this.authorize(news, params.account, 'NEWS_EDIT');
		return this.app.service('newsModel').patch(id, data);
	}
}

module.exports = function news() {
	const app = this;

	// use /news to access a user's news
	app.use('/news', new NewsService());
	app.service('news').hooks(hooks);

	// use /newsModel to directly access the model from other services
	// (external requests are blocked)
	app.use('/newsModel', service({
		Model: newsModel,
		lean: true,
		paginate: {
			default: 25,
		},
	}));
	app.service('/newsModel').hooks(newsModelHooks);

	app.use('/newshistory', service({
		Model: newsHistoryModel,
	}));
	const newsHistoryService = app.service('/newshistory');
	newsHistoryService.hooks(hooks);
};
