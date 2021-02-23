module.exports = {
	definitions: {
		jwtTimer: {
			type: 'object',
			properties: {
				ttl: {
					type: 'integer',
				},
			},
		},
	},
	operations: {
		create: {
			summary: 'reset jwt ttl',
			description:
				'resets the remaining time the JWT used to authenticate this request is whitelisted,' +
				' and returns the value it was reset to.' +
				' throws an 405 error if the instance does not have support for JWT whitelisting',
			requestBody: { description: 'no request body required' },
			responses: {
				200: {
					description: 'success',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/jwtTimer' } } },
				},
				405: {
					description: 'feature is disabled on this instance',
				},
			},
		},
		find: {
			summary: 'get ttl of the jwt',
			description:
				'returns the remaining seconds the JWT used to authenticate this request is whitelisted.' +
				' throws an 405 error if the instance does not have support for JWT whitelisting',
			parameters: {},
			responses: {
				200: {
					description: 'success',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/jwtTimer' } } },
				},
				405: {
					description: 'feature is disabled on this instance',
				},
			},
		},
	},
};
