module.exports = {
	passwordRecoveryService: {
		description: "A service for password recovery",
		find: {
			summary: "find"
		},
		create: {
			summary: "create"
		},
		remove: {
			summary: "remove"
		},
		update: {
			summary: "update"
		},
		patch: {
			summary: "patch"
		},
		get: {
			summary: "get"
		},
		changePasswordService: {
			create: {
				parameters: [
					{
						description: "data about user and password",
						required: true,
						name: "data",
						type: "data"
					}
				],
				summary: "change password",
			}
		}
	}
};
