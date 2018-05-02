module.exports = {
	resolveService: {
        description: "A service for resolve",
		scopeResolverService: {
			get: {
				parameters: [
					{
						description: "id of the user",
						required: true,
						name: "userId",
						type: "id"
					},
					{
						description: "params",
						required: true,
						name: "params",
						type: "params"
					}
				],
				summary:
					"Get scopes like courses and classes from user object Id"
			}
        },
        userResolverService: {
			get: {
				parameters: [
					{
						description: "UUID (e.g. course id)",
						required: true,
						name: "Id",
						type: "id"
					},
					{
						description: "params",
						required: true,
						name: "params",
						type: "params"
					}
				],
				summary:
					"Get users from UUID (e.g. course id)"
			}
		}
	}
};
