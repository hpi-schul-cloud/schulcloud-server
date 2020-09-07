const app = require('../../../src/app');

const getAllRoutes = () => {
	const convert = {};
	let paths;
	try {
		({
			docs: { paths },
		} = app);
	} catch (err) {
		throw new Error(err);
	}

	Object.keys(paths).forEach((path) => {
		const methods = Object.keys(paths[path]);
		const modle = path.indexOf('/{_id}') > -1;

		if (!(path.includes('/{_id}') || path.includes('/{id}'))) {
			const index = methods.indexOf('get');
			if (index !== -1) {
				methods[index] = 'find';
			}
		}

		const route = path.replace('/{id}', '').replace('/{_id}', '').substr(1);

		if (convert[route]) {
			convert[route].methods = convert[route].methods.concat(methods);
			if (modle) convert[route].modle = modle;
		} else {
			convert[route] = {
				modle,
				methods,
			};
		}
		convert[route].route = `/${route}`;
		convert[route].name = route;
	});
	return convert;
};

module.exports = getAllRoutes;
