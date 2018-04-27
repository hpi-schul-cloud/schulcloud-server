module.exports = {
	contentService: {
		resourcesService: {
			description: "A service to do something",
			get: {
				parameters: [
					{
						description: "get resourves service",
						required: true,
						name: "name",
						type: "string"
					}
				],
				summary: "get something",
				notes: "Does some stuff"
            },
            find: {
				parameters: [
					{
						description: "find resourves service",
						required: true,
						name: "name",
						type: "string"
					}
				],
				summary: "get something",
				notes: "Does some stuff"
			}
        },
        searchService: {
			description: "A service to search something",
			find: {
				parameters: [
					{
						description: "find search service",
						required: true,
						name: "name",
						type: "string"
					}
				],
				summary: "get something",
				notes: "Does some stuff"
			}
        },
        redirectService: {
			description: "A service to redirect something",
			get: {
				parameters: [
					{
						description: "get redirect service",
						required: true,
						name: "name",
						type: "string"
					}
				],
				summary: "get something",
				notes: "Does some stuff"
			}
		}
	}
};
