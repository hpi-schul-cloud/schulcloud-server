const sift = require('sift');

const filterByQuery = (roles = [], query = {}) => {
	let result = roles;
	const q = { ...query };
	delete q.$skip;
	delete q.$limit;
	delete q.$paginate;
	Object.entries(q).forEach(([key, v]) => {
		if (v instanceof RegExp) {
			result = result.filter((role) => role[key].match(v));
		}
	});
	return result.filter(sift(q));
};

module.exports = filterByQuery;
