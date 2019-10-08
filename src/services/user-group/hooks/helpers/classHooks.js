const prepareGradeLevelUnset = (context) => {
	if (!context.data.gradeLevel && context.data.name) {
		const unset = context.data.$unset || {};
		unset.gradeLevel = '';
		context.data.$unset = unset;
	}
	return context;
};

const sortByGradeAndOrName = (context) => {
	const defaultQuery = { gradeLevel: 1, name: 1 };
	if (!context.params
	|| !context.params.query
	|| !context.params.query.$sort
	|| Object.keys(context.params.query.$sort).length === 0) {
		context.params = context.params || {};
		context.params.query = context.params.query || {};

		context.params.query.$sort = defaultQuery;
		return context;
	}


	if (context.params.query.$sort) {
		const displayNameSortOrder = context.params.query.$sort.displayName;
		if (displayNameSortOrder !== undefined) {
			const newQuery = { gradeLevel: displayNameSortOrder, name: displayNameSortOrder };
			context.params.query.$sort = newQuery;
		}
	}
	return context;
};

module.exports = { prepareGradeLevelUnset, sortByGradeAndOrName };
