const prepareInternalParams = (params) => {
	const paramsCopy = JSON.parse(JSON.stringify(params));
	paramsCopy.provider = undefined;
	return paramsCopy;
};

module.exports = { prepareInternalParams };
