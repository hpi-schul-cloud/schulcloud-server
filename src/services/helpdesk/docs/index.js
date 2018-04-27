module.exports = {
	helpdeskService: {
		description: "A service to do something",
		create: {
			parameters: [
				{
					description: "service",
					required: true,
					name: "name",
					type: "string"
				}
			],
			summary: "Create something",
			notes:
				"Does some stuff"
		}
	}
};
