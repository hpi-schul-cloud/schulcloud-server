module.exports = {
	contentService: {
		resourcesService: {
			description: "A Service for content",
			get: {
				parameters: [
					{
						description: "id of the course",
						required: true,
						name: "course",
						type: "id"
					}
				],
				summary: "get the content of the course by the course id"
			},
			find: {
				parameters: [
					{
						description: "query to search with",
						required: true,
						name: "name",
						type: "query"
					}
				],
				summary: "executes the query within the content resources"
			}
		},
		searchService: {
			find: {
				parameters: [
					{
						description: "query to search with",
						required: true,
						name: "name",
						type: "query"
					}
				],
				summary: "executes the query within the content search"
			}
		},
		redirectService: {
			get: {
				parameters: [
					{
						description: "id of the required resource",
						required: true,
						name: "name",
						type: "id"
					}
				],
				summary:
					"returns the required resource url and increases the click counter"
			}
		}
	},
	materialService: {
		description: "A service for material",
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
		}
	}
};
