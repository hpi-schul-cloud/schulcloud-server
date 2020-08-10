const prepareGradeLevelUnset = (context) => {
	if (!context.data.gradeLevel && context.data.name) {
		const unset = context.data.$unset || {};
		unset.gradeLevel = '';
		context.data.$unset = unset;
	}
	return context;
};

const sortByGradeAndOrName = (context) => {
	const defaultQuery = { year: 1, gradeLevel: 1, name: 1 };
	if (
		!context.params ||
		!context.params.query ||
		!context.params.query.$sort ||
		Object.keys(context.params.query.$sort).length === 0
	) {
		context.params = context.params || {};
		context.params.query = context.params.query || {};

		context.params.query.$sort = defaultQuery;
		return context;
	}

	if (context.params.query.$sort) {
		const displayNameSortOrder = context.params.query.$sort.displayName;
		if (displayNameSortOrder !== undefined) {
			Object.assign(context.params.query.$sort, {
				gradeLevel: displayNameSortOrder,
				name: displayNameSortOrder,
			});
			delete context.params.query.$sort.displayName;
		}
	}
	return context;
};

const saveSuccessor = async (context) => {
	if (context.data.predecessor) {
		await context.app
			.service('classes')
			.patch(context.data.predecessor, { successor: context.result._id });
	}
	return context;
};

module.exports = {
	prepareGradeLevelUnset,
	sortByGradeAndOrName,
	saveSuccessor,
};
