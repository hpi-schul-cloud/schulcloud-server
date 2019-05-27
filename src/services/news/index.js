const service = require('feathers-mongoose');
const { Forbidden } = require('@feathersjs/errors');
const { newsModel, newsHistoryModel } = require('./model');
const hooks = require('./hooks');

/**
 * Recursively flattens an array
 * @param {Array} arr array to flatten
 * @example flatten([1, [2], [[3, 4], 5], 6]) => [1, 2, 3, 4, 5, 6]
 * @returns {Array} flatted array
 */
const flatten = arr => arr.reduce((agg, el) => {
	if (el instanceof Array) {
		return agg.concat(flatten(el));
	}
	return agg.concat(el);
}, []);

/**
 * Emulates Feathers-style pagination on a given array.
 * @param {Array} data Array-like collection to paginate
 * @param {Object} params Feathers request params containing paginate, $limit, and $skip
 * @returns {Object} { total, limit, skip, data }
 */
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
	async authorize(news, { userId, schoolId }, permission) {
		const authorized = await this.hasPermission(userId, permission, news.target, news.targetModel);
		const sameSchool = news.schoolId.toString() === schoolId.toString();
		if (!authorized || !sameSchool) {
			throw new Forbidden('Not authorized.');
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
		return newsModel.find({	schoolId, target: { $exists: false } }).lean();
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
				const news = await newsModel.find({
					targetModel: scope,
					target: item._id,
				}).lean();
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
	 * @memberof NewsService
	 */
	async get(id, params) {
		const news = await newsModel.findOne({ _id: id }).lean();
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
		return Promise.resolve(paginate(news, params));
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
		return newsModel.create(data);
	}

	/**
	 * DELETE /news/{id}
	 * Deletes a single news item.
	 * @param {BsonId|String} id The news item's Id
	 * @param {Object} params Note that params.query won't work here
	 * @returns {News} the deleted news item
	 * @throws {Forbidden} if not authorized
	 * @memberof NewsService
	 */
	async remove(id, params) {
		const news = await newsModel.findOne({ _id: id }).lean();
		await this.authorize(news, params.account, 'NEWS_CREATE');
		await newsModel.remove({ _id: id });
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
	 * @memberof NewsService
	 */
	async update(id, data, params) {
		const news = await newsModel.findOne({ _id: id }).lean();
		await this.authorize(news, params.account, 'NEWS_EDIT');
		return newsModel.findOneAndUpdate({ _id: id }, data).lean();
	}

	/**
	 * PATCH /news/{id}
	 * Patches a single news item
	 * @param {BsonId|String} id The news item's Id
	 * @param {Object} data object containing updated news item attributes
	 * @param {Object} params Feathers request params (note that using params.query won't work here)
	 * @returns {News} patched news item
	 * @throws {Forbidden} if not authorized
	 * @memberof NewsService
	 */
	async patch(id, data, params) {
		const news = await newsModel.findOne({ _id: id }).lean();
		await this.authorize(news, params.account, 'NEWS_EDIT');
		return newsModel.findOneAndUpdate({ _id: id }, { $set: data }).lean();
	}
}

module.exports = function news() {
	const app = this;
	app.use('/news', new NewsService());
	app.service('news').hooks(hooks);

	app.use('/newshistory', service({
		Model: newsHistoryModel,
	}));
	const newsHistoryService = app.service('/newshistory');
	newsHistoryService.hooks(hooks);
};
