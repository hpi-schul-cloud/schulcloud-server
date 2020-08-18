const { newsModel } = require('./db/news.schema');
const { paginate, convertToSortOrderObject } = require('../../../utils/array');
const logger = require('../../../logger');
const { DocumentNotFound } = require('../../../middleware/errors');

/**
 * @typedef {*} NewsSearchParam
 */
module.exports = class NewsRepo {
	// should be a part of base class
	checkExistence(resource, query) {
		if (!resource) {
			logger.error(`Cannot find resource item with query "${query}" => "${resource}"`);
			throw new DocumentNotFound('Resource does not exist.');
		}
	}

	/**
	 * Fields to populate after querying, including whitelisted attributes
	 * @static
	 * @memberof NewsService
	*/
	static populateParams() {
		return {
			query: {
				$populate: [
					{ path: 'schoolId', select: ['_id', 'name'] },
					{ path: 'creatorId', select: ['_id', 'firstName', 'lastName'] },
					{ path: 'updaterId', select: ['_id', 'firstName', 'lastName'] },
					{ path: 'target', select: ['_id', 'name'] },
				],
			},
		};
	}

	/**
	 *
	 * @param {NewsSearchParam} searchParams
	 * @param {*} scopeParams
	 */
	async searchForNews(searchParams, scopeQuery) { // searchParams = titleRegex and unpublished only
		// TODO validate scope params
		if ((scopeQuery || {}).length === 0) {
			return paginate([], searchParams);
		}

		const searchFilter = {};
		if (searchParams.titleRegex && /^[\w\s\d]{0,50}$/.test(searchParams.titleRegex)) {
			searchFilter.title = { $regex: searchParams.titleRegex };
		}

		// based on params.unpublished divide between view published news and unpublished news with edit permission
		const now = Date.now();
		searchFilter.displayAt = searchParams.unpublished ? { $gt: now } : { $lte: now };

		const sortQuery = {};
		if (searchParams.sort && /^-?\w{1,50}$/.test(searchParams.sort)) {
			sortQuery.$sort = convertToSortOrderObject(searchParams.sort);
		}

		const internalRequestParams = {
			query: {
				$or: scopeQuery,
				$limit: searchParams.$limit,
				$skip: searchParams.$skip,
				...NewsRepo.populateParams().query,
				...searchFilter,
				...sortQuery,
			},
			paginate: searchParams.$paginate,
		};
		return paginate(await newsModel.find({}).lean().exec(), { $paginate: true });
	}

	async readNews(id) {
		const internalRequestParams = { _id: id };

		const resource = await newsModel.findOne(internalRequestParams)
			.populate([{ path: 'schoolId', select: ['_id', 'name'] },
				{ path: 'creatorId', select: ['_id', 'firstName', 'lastName'] },
				{ path: 'updaterId', select: ['_id', 'firstName', 'lastName'] },
				{ path: 'target', select: ['_id', 'name'] }]).lean().exec();

		this.checkExistence(resource, internalRequestParams);
		return resource;
	}

	createNews(news) {
		return newsModel.create(news);
	}
};
