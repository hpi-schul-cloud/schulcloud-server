module.exports = {
	releasesService: {
		description: "A service for releases",
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
		releaseFetchService:{
			find: {
				parameters: [
					{
						description: "query",
						required: true,
						name: "name",
						type: "query"
					},
					{
						description: "payload",
						required: true,
						name: "name",
						type: "payload"
					}
				],
				summary: "Create an email",
				notes:
					"Does some stuff"
			}
		}
		
	}
};
