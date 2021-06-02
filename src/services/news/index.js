// eslint-disable-next-line max-classes-per-file
const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const { ObjectId } = require('mongoose').Types;

const { Forbidden, NotFound, BadRequest } = require('../../errors');
const { equal: equalIds } = require('../../helper/compare').ObjectId;
const logger = require('../../logger/index');
const newsDocs = require('./docs');
const { newsModel, targetModels, newsHistoryModel, newsPermissions } = require('./model');
const hooks = require('./hooks');
const newsModelHooks = require('./hooks/newsModel.hooks');
const { flatten, paginate, convertToSortOrderObject } = require('../../utils/array');
const { populateProperties } = require('./constants');

const DEFAULT_PAGINATION_OPTIONS = {
	default: 25,
};

class AbstractService {
	setup(app) {
		this.app = app;
	}

	/**
	 * Returns school query if the user is allowed to see.
	 * @param userId The user's Id
	 * @param schoolId The schoolId
	 * @returns Query
	 */
	createSchoolQuery(userId, schoolId, permission) {
		return this.hasSchoolPermission(userId, schoolId, permission).then((hasPermission) => {
			if (!hasPermission) {
				return null;
			}
			return [
				{
					schoolId,
					target: { $exists: false },
				},
			];
		});
	}

	/**
	 * Returns scoped news the user is allowed to see
	 *
	 * @param {BsonId|String} userId the user's Id
	 * @param {BsonId|String} target (optional) Id of the news target (course, team, etc.)
	 * @returns Array<Query>
	 */
	async createScopedQuery(userId, permission, target = null, targetModel = null) {
		// check params
		if (target ? !targetModel : targetModel) {
			throw new BadRequest('target and targetModel, both must be given or not');
		}
		// only one target requested
		if (target && targetModel) {
			return this.hasPermission(userId, permission, { target, targetModel }).then(() => [
				{
					targetModel,
					target,
				},
			]);
		}
		// return data of all user scopes
		const ops = targetModels.map(async (scope) => {
			// For each possible target model, find all targets the user has NEWS_VIEW permissions in.
			const scopeListService = this.app.service(`/users/:scopeId/${scope}`);
			if (scopeListService === undefined) {
				return null;
			}
			const scopeItems = await scopeListService.find({
				route: { scopeId: userId.toString() },
				query: {
					permissions: [permission],
				},
				paginate: false,
			});
			return scopeItems.map((item) => ({
				targetModel: scope,
				target: item._id,
			}));
		});
		const results = await Promise.all(ops);
		return flatten(results.filter((r) => r !== null));
	}

	/* Permissions */

	async getPermissions(userId, { target, targetModel, schoolId } = {}) {
		// target and school might be populated or not
		const isObjectId = (o) => o instanceof ObjectId || typeof o === 'string';
		// scope case: user role in scope must have given permission
		if (target && targetModel && targetModel !== 'schools') {
			const targetId = isObjectId(target) ? target.toString() : target._id.toString();
			const scope = this.app.service(`${targetModel}/:scopeId/userPermissions/`);
			const params = { route: { scopeId: targetId } };
			const scopePermissions = await scope.get(userId, params);
			return scopePermissions;
		}
		if (targetModel === 'schools') {
			// default school case: dataItem and users schoolId must match and user permission must exist
			return this.getSchoolPermissions(userId, isObjectId(schoolId) ? schoolId : schoolId._id);
		}
		return [];
	}

	/**
	 * Checks scoped permission for a user and given news.
	 * @param {BsonId|String} userId
	 * @param {String} permission
	 * @param {Object} dataItem {target, targetModel} news target (scope) id and target model.
	 * @returns {Promise<Boolean>} Promise that resolves to true/false
	 * @example
	 * await hasPermission(user._id, 'NEWS_CREATE', {target: team._id, targetModel: 'teams'}) => false
	 * @memberof NewsService
	 */
	async hasPermission(userId, permission, dataItem) {
		if (!dataItem) {
			// use hasSchoolPermission instead
			return false;
		}
		const permissions = await this.getPermissions(userId, dataItem);
		return permissions.includes(permission);
	}

	/**
	 * Tests if a user with given userId has a (global) permission within a school.
	 * @param {ObjectId} userId
	 * @param {ObjectId} schoolId
	 * @returns {Array<String>}
	 */
	async getSchoolPermissions(userId, schoolId) {
		// test user exists
		const user = await this.app.service('users').get(userId);
		if (user == null) return [];

		// test user is school member
		const sameSchool = equalIds(schoolId, user.schoolId);
		if (!sameSchool) return [];

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

	checkExistence(resource, query) {
		if (!resource) {
			logger.error(`Cannot find resource item with query "${query}" => "${resource}"`);
			throw new NotFound('Resource does not exist.');
		}
	}
}

// eslint-disable-next-line import/prefer-default-export
class NewsService extends AbstractService {
	/**
	 * Fields to populate after querying, including whitelisted attributes
	 * @static
	 * @memberof NewsService
	 */
	static populateParams() {
		return {
			query: {
				$populate: populateProperties,
			},
		};
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
		if (result.data) {
			// paginated result set
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
			permissions: await this.getPermissions(userId, {
				target: (n.target || {})._id,
				targetModel: n.targetModel,
				schoolId: n.schoolId,
			}),
		});

		if (result instanceof Array) {
			return Promise.all(result.map(decorate));
		}
		if (result.data) {
			// paginated result set
			const decoratedData = await Promise.all(result.data.map(decorate));
			return { ...result, data: decoratedData };
		}
		return decorate(result);
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
	 * Builds a mongoose-query based on the request params.
	 * It is possible to request only school news (target='school'),
	 * only scope news (target=[some id], targetModel=[teams/courses/...]), or both (default).
	 * @param {Object} params Feathers request params
	 * @param {Object} baseFilter
	 * @returns {Object} mongoose-style query object
	 * @memberof NewsService
	 */
	async buildFindQuery(params, baseFilter) {
		const query = [];
		const scoped = !!(params.query && (params.query.target || params.query.targetModel));
		if (scoped) {
			// add selected scope news
			query.push(
				await super.createScopedQuery(
					params.account.userId,
					baseFilter.permission,
					params.query.target,
					params.query.targetModel
				)
			);
		} else {
			// add school news
			query.push(await super.createSchoolQuery(params.account.userId, params.account.schoolId, baseFilter.permission));
			if ((params.query || {}).target !== 'school') {
				// add all scope news if more than the current school is requested
				query.push(await super.createScopedQuery(params.account.userId, baseFilter.permission));
			}
		}
		return flatten(query.filter((q) => q !== null));
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
		const { userId } = params.account;
		const newsModelService = this.app.service('newsModel');
		return this.getByIdForUserId(id, userId, newsModelService);
	}

	async getByIdForUserId(id, userId, newsModelService) {
		const news = await newsModelService.get(id, NewsService.populateParams());
		this.checkExistence(news, id);
		const now = Date.now();
		if (news.displayAt > now) {
			await this.authorize(news, userId, newsPermissions.EDIT);
		} else {
			await this.authorize(news, userId, newsPermissions.VIEW);
		}

		news.permissions = await this.getPermissions(userId, news);
		return NewsService.decorateResults(news);
	}

	/**
	 * GET /news/
	 * Returns all news the user can see.
	 * @param {Object} params
	 * @returns paginated array of news items
	 * @memberof NewsService
	 */
	async find(params) {
		const query = { $paginate: DEFAULT_PAGINATION_OPTIONS, ...params.query };
		const now = Date.now();
		// based on params.unpublished divide between view published news and unpublished news with edit permission
		const baseFilter = {
			published: query.unpublished ? { $gt: now } : { $lte: now },
			permission: query.unpublished ? newsPermissions.EDIT : newsPermissions.VIEW,
		};
		const searchFilter = {};
		if (query.q && /^[\w\s\d]{0,50}$/.test(query.q)) {
			searchFilter.title = { $regex: query.q };
		}
		const sortQuery = {};
		if (query.sort && /^-?\w{1,50}$/.test(query.sort)) {
			sortQuery.$sort = convertToSortOrderObject(query.sort);
		}
		const subqueries = await this.buildFindQuery(params, baseFilter);
		if (subqueries.length === 0) {
			return paginate([], query);
		}
		const internalRequestParams = {
			query: {
				displayAt: baseFilter.published,
				$or: subqueries,
				$limit: query.$limit,
				$skip: query.$skip,
				...NewsService.populateParams().query,
				...searchFilter,
				...sortQuery,
			},
			paginate: query.$paginate,
		};
		return this.app
			.service('newsModel')
			.find(internalRequestParams)
			.then(NewsService.decorateResults)
			.then((result) => this.decoratePermissions(result, params.account.userId));
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
		await this.authorize(data, params.account.userId, newsPermissions.CREATE);
		const newNewsData = {
			...data,
			creatorId: params.account.userId,
			updaterId: null,
		};
		return this.app.service('newsModel').create(newNewsData);
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
		const news = await this.app.service('newsModel').get(id, NewsService.populateParams());
		this.checkExistence(news, id);
		await this.authorize(news, params.account.userId, newsPermissions.REMOVE);
		await this.app.service('newsModel').remove(id);
		return NewsService.decorateResults(news);
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
		await this.authorize(news, params.account.userId, newsPermissions.EDIT);
		const updatedNewsData = {
			...data,
			updaterId: params.account.userId,
		};
		const updatedNews = await this.app.service('newsModel').update(id, updatedNewsData, NewsService.populateParams());
		await NewsService.createHistoryEntry(news);
		return NewsService.decorateResults(updatedNews);
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
		const news = await this.app.service('newsModel').get(id, NewsService.populateParams());
		this.checkExistence(news, id);
		await this.authorize(news, params.account.userId, newsPermissions.EDIT);
		const patchedNewsData = {
			...data,
			updaterId: params.account.userId,
		};
		const patchedNews = await this.app.service('newsModel').patch(id, patchedNewsData, NewsService.populateParams());
		await NewsService.createHistoryEntry(news);
		return NewsService.decorateResults(patchedNews);
	}
}

module.exports = function news() {
	const app = this;

	const newsService = new NewsService();
	newsService.docs = newsDocs;
	// use /news to access a user's news
	app.use('/news/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/news', newsService);
	app.service('news').hooks(hooks);

	// use /newsModel to directly access the model from other services
	// (external requests are blocked)
	app.use(
		'/newsModel',
		service({
			Model: newsModel,
			lean: true,
			paginate: DEFAULT_PAGINATION_OPTIONS,
		})
	);
	app.service('/newsModel').hooks(newsModelHooks);
};
