
// For inter-component calls
module.exports = class NewsBcFacade {
	setup(app, bcContext) {
		// import necessary serivce
		this.newsRepo = app.service('newsRepo');
	}
};
