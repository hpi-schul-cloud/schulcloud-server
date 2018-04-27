module.exports = {
	resolveService: {
        description: "A service for resolve",
		scopesService: {
			get: {
				parameters: [
					{
						description: "ID of scopes to return",
						required: true,
						name: "resourceId",
						type: "integer"
					}
				],
				summary:
					"Do something with the id"
			}
        },
        usersService: {
			get: {
				parameters: [
					{
						description: "ID of users to return",
						required: true,
						name: "resourceId",
						type: "integer"
					}
				],
				summary:
					"Do something else with the id"
			}
		}
	}
};
