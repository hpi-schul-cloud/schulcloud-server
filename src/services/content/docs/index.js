module.exports = {
	contentService: {
		description: "A Service for content",
		resourcesService: {
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
				summary: "returns the required resource url and increases the click counter"
			}
		}
	}
};
