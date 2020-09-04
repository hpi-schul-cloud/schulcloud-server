const ScopeUc = require('./scope.uc');

class ScopeBcFacade {
	setup(app) {
		// import necessary serivce
		this.scopeUc = new ScopeUc();
	}

	async getPermissions(userId, { target, targetModel, schoolId } = {}) {
		return this.scopeUc.getPermissions(userId, { target, targetModel, schoolId });
	}

	async getSchoolPermissions(userId, schoolId) {
		return this.scopeUc.getSchoolPermissions(userId, schoolId);
	}

	async hasSchoolPermission(userId, schoolId, permision) {
		return this.scopeUc.hasSchoolPermission(userId, schoolId, permision);
	}

	async hasPermission(userId, permission, dataItem) {
		return this.scopeUc.hasPermission(userId, permission, dataItem);
	}

	async authorize(news = {}, userId, permission) {
		return this.scopeUc.authorize(news, userId, permission);
	}

	createSchoolQuery(userId, schoolId, permission) {
		return this.scopeUc.createSchoolQuery(userId, schoolId, permission);
	}

	async createScopedQuery(userId, permission, target = null, targetModel = null) {
		return this.scopeUc.createScopedQuery(userId, permission, target, targetModel);
	}

	async buildScopeParams(searchParams, account, permission) {
		return this.scopeUc.buildScopeParams(searchParams, account, permission);
	}
}

module.exports = ScopeBcFacade;
