const { BadRequest } = require('@feathersjs/errors');
const logger = require('../../../logger');

module.exports = class NewsRestService {
	constructor(serviceLocator) {
		this.newsUc = serviceLocator.service('newsUc');
	}

	createSearchParams({
		title, q, unpublished, $sort, $limit, $paginate,
	}) { // just to avoid ...servParams
		return Object.freeze({
			title, titleRegex: q, unpublished, $sort, $limit, $paginate,
		});
	}

	transformIntoResultTo(results) {
		return results;

		// return results.map((newsEntry) => {
		// 	const { _id, title, displayAt } = newsEntry;
		// 	return Object.freeze({
		// 		_id, title, displayAt, schoolId:
		// 	});
		// });
	}

	//
	// Access Control - Permssion check done with hook
	// params validation ca be done by the hook
	async find(params) {
		// transform request params into application specific param object (if necessary)
		// i.e. separate application logic from frameworks, transport protocols etc.
		const searchParams = params.query;
		const { account } = params;
		return this.newsUc.find(searchParams, account).then(this.transformIntoResultTo);
	}

	async create(news, params) {
		if (news && news.title) {
			try {
				return await this.newsUc.createNews(news);
			} catch (error) {
				logger.error(error);
				throw new BadRequest(`News '${news.title}' already exists`);
			}
		}
		throw new BadRequest('Property \'login\' not provided');
	}

	/**
	 * GET /news/{id}
	 * Returns the news item specified by id
	 * @param {BsonId|String} id
	 * @param {Object} params
	 * @returns one news item
	 * @throws {Frobidden} if not authorized
	 * @throws {DocumentNotFound} if the id does not belong to a news object
	 * @memberof NewsService
	 */
	async get(id, params) {
		return this.newsUc.readNews(id, params.account);
	}
};
