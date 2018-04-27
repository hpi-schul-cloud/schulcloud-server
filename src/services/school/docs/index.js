module.exports = {
	schoolService: {
		description: "A service to do mails",
		create: {
			parameters: [
				{
					description: "mail",
					required: true,
					name: "name",
					type: "string"
				}
			],
			summary: "Create an email",
			notes:
				"Does some stuff"
		}
	}
};
