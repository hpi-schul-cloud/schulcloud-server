const NewsUc = require('../uc/news.uc');

module.exports = class NewsRestService {
	setup(app) {
		this.newsUc = new NewsUc(app);
	}

	//
	// Access Control - Permssion check done with hook
	// params validation ca be done by the hook
	async find(params) {
		// transform request params into application specific param object (if necessary)
		// i.e. separate application logic from frameworks, transport protocols etc.
		const searchParams = params.query;
		const { account } = params;
		return this.newsUc.findNews(searchParams, account).then(this.transformIntoResultTo);
	}

	async create(news, params) {
		return this.newsUc.createNews(news, params.account);
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

	transformIntoResultTo(results) {
		// return results;

		const data = results.data.map((newsEntry) => {
			const { __v, ...rest } = newsEntry; // example: skip __v from the result Transport Object
			return rest;
		});

		return { ...results, data };
	}
};
