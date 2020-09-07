// For inter-component calls
module.exports = class NewsBcFacade {
	setup(app) {
		// import necessary serivce
		// could be done via mixin
		this.newsUc = app.service('newsUc');
	}

	async createNews(news, account) {
		return this.newsUc.createNews(news, account);
	}

	async readNews(id, account) {
		return this.newsUc.readNews(id, account);
	}

	async findNews(searchParams, account) {
		return this.newsUc.findNews(searchParams, account);
	}
};
