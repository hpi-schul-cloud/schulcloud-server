module.exports = {
	description: 'a service that handles access to news from various scopes.',
	definitions: {
		news: {
			title: 'News',
			type: 'Object',
			properties: {
				schoolId: {
					type: 'string',
					pattern: '[a-f0-9]{24}',
				},
			},
		},
	},
	/* operations: {

	}, */
};
