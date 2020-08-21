module.exports = {
	statisticsService: {
		description: 'A service to return statistics',
		find: {
			summary: 'Returns the count of specific collections.',
		},
		get: {
			parameters: [
				{
					description: 'The id of the requested collection (users, schools, accounts, homework, ...).',
					required: true,
					name: 'id',
					type: 'string',
				},
				{
					description: 'Whether to return an object of all entries or two arrays of x and y values.',
					required: false,
					name: 'returnArray',
					type: 'boolean',
				},
			],
			summary:
				'Returns the count of a single collection according to the createdAt value of every entry as either 2 arrays or an object containing all values.',
		},
	},
};
