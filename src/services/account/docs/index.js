module.exports = {
	accountService: {
		description: "A service for accounts",
		CustomJWTService: {
			create: {
				parameters: [
					{
						description: "Userdata for the User to be created",
						required: true,
						name: "Data",
						type: "data"
					}
				],
				summary: "Creates a new Account"
			}
		},
		passwordGenService: {
			find: {
				parameters: [
					{
						description: "query used to generate",
						required: true,
						name: "query",
						type: "object"
					},
					{
						description: "payload",
						required: true,
						name: "payload",
						type: "object"
					}
				],
				summary: "Generates a random String depending on the query parameters"
			}
		}
	}
};
