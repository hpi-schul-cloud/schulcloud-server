const _ = require('lodash');
const appPromise = require('../../../src/app');

const removeLeadingSlash = (str) => str.replace(/^\//, '');
const removeTrailingSlash = (str) => str.replace(/\/$/, '');
const escapeUrlParameter = (url) => url.replace(/\/:([^/]*)?($|\/)/, '/{$1}/');

const getAllRoutes = async () => {
	const app = await appPromise;
	// eslint-disable-next-line no-underscore-dangle
	const routes = app._router.stack.filter((x) => x.route && x.route.path && x.route.path !== '*').map((x) => x.route);
	const groupedRoutes = _.groupBy(routes, (r) => r.path.replace(/\/:__feathersId$/, ''));
	return Object.fromEntries(
		Object.entries(groupedRoutes).map(([unescapedRoute, group]) => {
			const route = removeTrailingSlash(escapeUrlParameter(unescapedRoute));
			const name = removeLeadingSlash(route);
			const methods = _.uniq(group.map((r) => Object.keys(r.methods).filter((k) => r.methods[k])).flat());

			return [name, { methods, route, name }];
		})
	);
};

module.exports = getAllRoutes;
