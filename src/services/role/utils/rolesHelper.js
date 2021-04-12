/**
 * @function sortRoles
 * returns a two dimensional hierarchically sorted Array
 * @param {Role[]} roles
 * @return {[Role[]]}
 */

const sortRoles = (roles) => {
	const startRoles = roles.filter((role) => role.roles.length === 0);

	const sort = (sorted) => {
		const [last] = sorted.slice(-1);

		const parents = last.reduce((arr, child) => {
			const found = roles.filter((el) => el.roles.map((role) => role.toString()).includes(child._id.toString()));

			if (found.length) {
				return arr.concat(found);
			}

			return arr;
		}, []);

		if (parents.length) {
			sorted.push(parents);
			return sort(sorted);
		}

		return sorted;
	};

	return sort([startRoles]);
};

module.exports = {
	sortRoles,
};
