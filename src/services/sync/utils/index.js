const filterKeys = (data = {}, allowedKeys = []) => {
	const filteredEntries = Object.entries(data).filter(([key]) => allowedKeys.includes(key));
	return Object.fromEntries(filteredEntries);
};

const batchFilterKeys = (data, allowedKeys = null) => {
	let result = data;
	if (allowedKeys) {
		const filteredEntries = Object.entries(data).map(([k, v]) => [k, filterKeys(v, allowedKeys)]);
		result = Object.fromEntries(filteredEntries);
	}
	return result;
};

module.exports = {
	filterKeys,
	batchFilterKeys,
};
