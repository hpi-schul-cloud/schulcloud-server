module.exports = {
	accountService: {
		CustomJWTService: {
			description: "A service to do sth",
			create: {
				parameters: [
					{
						description: "description",
						required: true,
						name: "username",
						type: "string"
					}
				],
				summary: "Do Something",
				notes: "Does stuff."
			}
		},
		passwordGenService: {
			description: "A service to do passwords",
			find: {
				parameters: [
					{
						description: "description",
						required: true,
						name: "username",
						type: "string"
					}
				],
				summary: "Do stuff",
				notes: "notes"
			}
		}
	}
};
