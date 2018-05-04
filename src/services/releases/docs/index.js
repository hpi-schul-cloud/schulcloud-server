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
						description: "object including query and payload",
						required: true,
						name: "query, payload",
						type: "object"
					}
				],
				summary: "find"
			}
		}
		
	}
};
