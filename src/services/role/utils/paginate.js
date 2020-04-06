const paginate = (result = [], { $limit, $skip = 0 } = {}) => {
	if (!Array.isArray(result)) {
		return result;
	}
	const data = result.slice($skip, $limit ? $skip + $limit : $limit);
	return {
		total: data.length,
		limit: $limit || result.length || data.length,
		skip: $skip,
		data,
	};
};

module.exports = paginate;
