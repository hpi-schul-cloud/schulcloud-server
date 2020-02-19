const { UserResolver, userResolverHooks } = require('./services/userResolveService');
const { ScopeResolver, scopeResolverHooks } = require('./services/scopeResolverService');

module.exports = (app) => {
	// Initialize our service with any options it requires
	app.use('/resolve/scopes', new ScopeResolver());
	app.service('/resolve/scopes').hooks(scopeResolverHooks);
	app.use('/resolve/users', new UserResolver());
	app.service('/resolve/users').hooks(userResolverHooks);
};
