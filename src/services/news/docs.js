module.exports = {
	description: 'a service that handles access to news from various scopes.',
	definitions: {
		news: {
			title: 'News',
			type: 'object',
			additionalProperties: false,
			properties: {
				schoolId: {
					type: 'string',
					pattern: '[a-f0-9]{24}',
				},
				title: {
					type: 'string',
				},
				content: {
					type: 'string',
				},
				displayAt: {
					type: 'string',
					format: 'date',
					description: 'the news will become public at this date. Defaults to be the same as creation date.',
				},
				creatorId: {
					type: 'string',
					pattern: '[a-f0-9]{24}',
					description: 'id of the user that created the news',
					readOnly: true,
				},
				createdAt: {
					type: 'string',
					format: 'date',
					readOnly: true,
				},
				updaterId: {
					type: 'string',
					pattern: '[a-f0-9]{24}',
					description: 'id of the user that last updated the news',
					readOnly: true,
				},
				updatedAt: {
					type: 'string',
					format: 'date',
					readOnly: true,
				},
				target: {
					type: 'string',
					pattern: '[a-f0-9]{24}',
					description: 'id of the scope the news belongs to.'
					+ 'If no target is given, the news will belong to the school.',
				},
				targetModel: {
					type: 'string',
					enum: ['courses', 'teams', 'class'],
					description: 'the type of the scope the news belongs to.'
					+ 'required if a target is given',
				},
				source: {
					type: 'string',
					default: 'internal',
					enum: ['internal', 'rss'],
					readOnly: true,
				},
				externalId: {
					type: 'string',
					description: 'guid of an rss feed',
					readOnly: true,
				},
				sourceDescription: {
					type: 'string',
					readOnly: true,
				},
			},
		},
		news_list: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: {
						$ref: '#/components/schemas/news',
					},
				},
				total: { type: 'integer' },
				limit: { type: 'integer' },
				skip: { type: 'integer' },
			},
		},
	},
	/* operations: {

	}, */
};
