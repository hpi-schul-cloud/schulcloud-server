const paginate = (result = [], { $limit, $skip = 0 } = {}, total) => (Array.isArray(result) ? ({
	total: total || result.length,
	limit: $limit || total || result.length,
	skip: $skip,
	data: result.slice($skip, $limit ? $skip + $limit : $limit),
}) : result);

module.exports = paginate;
