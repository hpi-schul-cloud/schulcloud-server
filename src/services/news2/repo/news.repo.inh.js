const { newsModel } = require('./db/news.schema');
const { paginate, convertToSortOrderObject } = require('../../../utils/array');
const ScopeRepo = require('../../../common/repo/ScopeRepo');

module.exports = class NewsRep extends ScopeRepo { // more extensions possible with mixins
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

	async searchForNews(searchParams, scopeParams) {
		if ((scopeParams || {}).length === 0) {
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
				...searchFilter,
				...sortQuery,
			},
		};
		return newsModel.find(internalRequestParams);
		// return newsModel
		//	.find(internalRequestParams);
	}

	async createNews(news) {
		return newsModel.create(news);
	}
};
