const { ObjectId } = require('mongoose').Types;
const { Forbidden } = require('@feathersjs/errors'); // should be replaced by an application error
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { flatten } = require('../../../utils/array');
const { ValidationError } = require('../../../middleware/errors');
const targetModels = require('../repo/targetModels');


module.exports = class ScopeUc {
	async getPermissions(userId, { target, targetModel, schoolId } = {}) {
		// target and school might be populated or not
		const isObjectId = (o) => o instanceof ObjectId || typeof o === 'string';
		// scope case: user role in scope must have given permission
		if (target && targetModel) {
			const targetId = isObjectId(target) ? target.toString() : target._id.toString();
			const scope = this.app.service(`${targetModel}/:scopeId/userPermissions/`);
			const params = { route: { scopeId: targetId } };
			const scopePermissions = await scope.get(userId, params);
			return scopePermissions;
		}

		// default school case: dataItem and users schoolId must match and user permission must exist
		return this.getSchoolPermissions(userId, isObjectId(schoolId) ? schoolId : schoolId._id);
	}

	/**
	 * Tests if a user with given userId has a (global) permission within a school.
	 * @param {ObjectId} userId
	 * @param {ObjectId} schoolId
	 * @returns {Array<String>}
	 */
	async getSchoolPermissions(userId, schoolId) {
		// test user exists
		const user = await this.userService.get(userId);
		if (user == null) return [];

		// test user is school member
		const sameSchool = equalIds(schoolId, user.schoolId);
		if (!sameSchool) return [];

		return user.permissions;
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

	/**
	* Returns school query if the user is allowed to see.
	* @param userId The user's Id
	* @param schoolId The schoolId
	* @returns Query
	*/
	createSchoolQuery(userId, schoolId, permission) {
		return this.hasSchoolPermission(userId, schoolId, permission)
			.then((hasPermission) => {
				if (!hasPermission) {
					return null;
				}
				return [{
					schoolId,
					target: { $exists: false },
				}];
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
			throw new ValidationError('target and targetModel, both must be given or not');
		}
		// only one target requested
		if (target && targetModel) {
			return this.hasPermission(userId, permission, { target, targetModel })
				.then(() => (
					[{
						targetModel,
						target,
					}]));
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

	/**
	 * FURTHER REFACTORING NEEDED - THE METHOD IS SUPPOSED TO CREATE QUERY PARAMS ONLY!
	 * Builds a mongoose-query based on the request params.
	 * It is possible to request only school news (target='school'),
	 * only scope news (target=[some id], targetModel=[teams/courses/...]), or both (default).
	 * @param {Object} params Feathers request params
	 * @param {Object} baseFilter
	 * @returns {Object} mongoose-style query object
	 * @memberof NewsService
	 */
	async buildScopeParams(searchParams, account, permission) {
		const query = [];
		const scoped = !!(searchParams && (searchParams.target || searchParams.targetModel));
		if (scoped) {
			// add selected scope news
			query.push(await this.createScopedQuery(
				account.userId, permission, searchParams.target, searchParams.targetModel,
			));
		} else {
			// add school news
			query.push(await this.createSchoolQuery(
				account.userId, account.schoolId, permission,
			));
			if ((searchParams || {}).target !== 'school') {
				// add all scope news if more than the current school is requested
				query.push(await this.createScopedQuery(
					account.userId, permission,
				));
			}
		}
		return flatten(query.filter((q) => q !== null));
	}

	setup(app) {
		this.app = app;
		this.userService = app.service('user');
	}
};
