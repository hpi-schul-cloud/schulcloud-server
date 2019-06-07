const service = require('feathers-mongoose');
const { Forbidden, NotFound } = require('@feathersjs/errors');
const logger = require('winston');
const { newsModel, newsHistoryModel } = require('./model');
const hooks = require('./hooks');
const newsModelHooks = require('./hooks/newsModel.hooks');
const { flatten, paginate, sort } = require('../../utils/array');

class NewsService {
	setup(app) {
		this.app = app;
	}


	async getPermissions(userId, dataItem) {
		// scope case: user role in scope must have given permission
		if (dataItem.target && dataItem.targetModel) {
			const scope = this.app.service(`${dataItem.targetModel}/:scopeId/userPermissions/`);
			const params = { route: { scopeId: dataItem.target.toString() } };
			const scopePermissions = await scope.get(userId, params);
			return scopePermissions;
		}

		// default school case: dataItem and users schoolId must match and user permission must exist
		return this.getSchoolPermissions(userId, dataItem.schoolId);
	}

	/**
		 * Checks scoped permission for a user and given news.
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
	async hasPermission(userId, permission, news) {
		if (!news) {
			// maybe, use hasSchoolPermission instead...
			return false;
		}
		const permissions = await this.getPermissions(userId, news);
		return permissions.includes(permission);
	}

	/**
	 * Tests if a user with given userId has a (global) permission within a school-/scope/.
	 * @param {ObjectId} userId
	 * @param {ObjectId} schoolId
	 * @returns {Array<String>}
	 */
	async getSchoolPermissions(userId, schoolId) {
		// test user exists
		const user = await this.app.service('users').get(userId);
		if (user == null) return [];

		// test user is school member
		const sameSchool = schoolId.toString() === user.schoolId.toString();
		if (!sameSchool) return [];

		// finally, test user has permission
		return user.permissions;
	}

	async hasSchoolPermission(userId, schoolId, permision) {
		const permissions = await this.getSchoolPermissions(userId, schoolId);
		return permissions.includes(permision);
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
	async authorize(news = {}, userId, permission) {
		const authorized = await this.hasPermission(userId, permission, news);
		if (!authorized) {
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
	findSchoolNews({ userId, schoolId }) {
		const now = Date.now();
		return this.hasSchoolPermission(userId, schoolId, 'NEWS_VIEW')
			.then((hasPermission) => {
				if (!hasPermission) {
					return [];
				}
				const query = {
					schoolId,
					target: { $exists: false },
					$and: { permissions: ['NEWS_VIEW'], displayAt: { $lte: now } },
				};
				return this.app.service('newsModel').find({ query, paginate: false });
			}).then(news => Promise.all(news.map(async n => ({
				...n,
				permissions: await this.getPermissions(userId, n),
			}))))
			.catch((err) => {
				logger.error('Cannot find school news', err);
				return [];
			});
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
		const now = Date.now();
		const scopes = await newsModel.distinct('targetModel');
		const ops = scopes.map(async (scope) => {
			// For each possible target model, find all targets the user has NEWS_VIEW permissions in.
			const scopeListService = this.app.service(`/users/:scopeId/${scope}`);
			if (scopeListService === undefined) {
				throw new Error(`Missing ScopeListService for scope "${scope}".`);
			}
			let scopeItems = await scopeListService.find({
				route: { scopeId: userId.toString() },
				query: {
					$and: { permissions: ['NEWS_VIEW'], displayAt: { $lte: now } },
				},
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
					permissions: await this.getPermissions(userId, n),
				})));
			}));
		});
		const results = await Promise.all(ops);
		return flatten(results);
	}

	/**
	 * Create a copy of the original news if it is edited
	 * @param {News} oldItem
	 * @returns {Promise<NewsHistory>} the created news history document
	 * @memberof NewsService
	 * @static
	 */
	static createHistoryEntry(oldItem) {
		const historyEntry = {
			title: oldItem.title,
			content: oldItem.content,
			displayAt: oldItem.displayAt,
			creatorId: oldItem.updaterId ? oldItem.updaterId : oldItem.creatorId,
			parentId: oldItem._id,
		};
		return newsHistoryModel.create(historyEntry);
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
		await this.authorize(news, params.account.userId, 'NEWS_VIEW');
		news.permissions = await this.getPermissions(params.account.userId, news);
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
		if (params.query) {
			news = sort(news, params.query.$sort);
		}
		// paginate by default, but let $paginate=false through
		news = paginate(news, { $paginate: true, ...params.query });
		return Promise.resolve(news);
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
		await this.authorize(data, params.account.userId, 'NEWS_CREATE');
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
		await this.authorize(news, params.account.userId, 'NEWS_CREATE');
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
		await this.authorize(news, params.account.userId, 'NEWS_EDIT');
		const updatedNews = await this.app.service('newsModel').update(id, data);
		await NewsService.createHistoryEntry(news);
		return updatedNews;
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
		await this.authorize(news, params.account.userId, 'NEWS_EDIT');
		const patchedNews = await this.app.service('newsModel').patch(id, data);
		await NewsService.createHistoryEntry(news);
		return patchedNews;
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
};
