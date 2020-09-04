const _ = require('lodash');
const app = require('../../../src/app');

const getAllRoutes = () => {
	// new Set(app._router.stack.filter((x) => x.route && x.route.path).map((x => x.route.path)))
	const routes = app._router.stack.filter((x) => x.route && x.route.path).map((x) => x.route);
	const groupedRoutes = _.groupBy(routes, (r) => r.path.replace(/\/:__feathersId$/, ''));
	return Object.fromEntries(
		Object.entries(groupedRoutes).map(([route, group]) => {
			const name = route.replace(/^\//, '');
			const methods = _.uniq(group.map((r) => Object.keys(r.methods).filter((k) => r.methods[k])).flat());

			return [route, { methods, route, name }];
		}),
	);
};

module.exports = getAllRoutes;
