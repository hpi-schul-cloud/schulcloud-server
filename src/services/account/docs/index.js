module.exports = {
	accountService: {
		description: "A service for accounts",
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
		CustomJWTService: {
			create: {
				parameters: [
					{
						description: "Userdata for the User to be created",
						required: true,
						name: "Userdata",
						type: "data"
					}
				],
				summary: "Creates a new Account"
			}
		},
		passwordGenService: {
			find: {
				summary: "Generates a random String"
			}
		},
		confirmService:{
			create:{
				parameters:[
					{
						description: "data",
						required: true,
						name: "name",
						type: "type"
					},
					{
						description: "param",
						required: true,
						name: "parameter",
						type: "param"
					}
				],
				summary: "create"
			},
		}
	}
};
