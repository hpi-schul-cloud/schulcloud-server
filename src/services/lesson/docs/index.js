module.exports = {
	lessonService: {
		description: "A service to do lessons",
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
		contentService: {
			find: {
				parameters:[
					{
						description: "param",
						required: true,
						name: "param",
						type: "param"
					}
				],
				summary: "Return all lesson.contets which have component = query.type And User = query.user or null"
			}
		}
	}
};
