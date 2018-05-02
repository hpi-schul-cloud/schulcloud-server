module.exports = {
	lessonService: {
		description: "A service to do lessons",
		find: {
			parameters: [
				{
					description: "query",
					required: true,
					name: "name",
					type: "query"
				}
			],
			summary:
				"find sth"
		}
	}
};
