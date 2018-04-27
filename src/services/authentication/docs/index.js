module.exports = {
	authenticationService: {
		description: "A service to send and receive messages",
		create: {
			//type: 'Example',
			parameters: [
				{
					description: "username or email",
					//in: 'path',
					required: true,
					name: "username",
					type: "string"
				},
				{
					description: "password",
					//in: 'path',
					required: false,
					name: "password",
					type: "string"
				},
				{
					description:
						"ID of the system that acts as a login provider. Required for new accounts or accounts with non-unique usernames.",
					//in: 'path',
					required: false,
					name: "systemId",
					type: "string"
				}
			],
			summary: "Log in with or create a new account",
			notes:
				"Returns a JSON Web Token for the associated user in case of success."
			//errorResponses: []
		}
	}
};
