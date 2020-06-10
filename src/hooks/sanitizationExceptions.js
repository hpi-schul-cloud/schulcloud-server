exports.excludeAttributesFromSanitization = (excludePath, attributeNames) => (context) => {
	if (context.path === excludePath) {
		context.safeAttributes = attributeNames;
	}
	return Promise.resolve(context);
};
