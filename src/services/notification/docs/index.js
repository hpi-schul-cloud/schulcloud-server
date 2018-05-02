module.exports = {
	notificationService: {
		description: "A service for notifications",
		get: {
			parameter: [
				{
					description: "id"
				},
				{
					description: "params"
				}
			],
			summary: "get"
		},
		find: {
			parameter: [
				{
					description: "params"
				}
			],
			summary: "find"
		},
		messagesService: {
			create: {
				parameter: [
					{
						description: "data"
					},
					{
						description: "params"
					}
				],
				summary: "create"
			},
			get: {
				parameter: [
					{
						description: "id"
					},
					{
						description: "params"
					}
				],
				summary: "get"
			}
		},
		deviceService: {
			find: {
				parameter: [
					{
						description: "params"
					}
				],
				summary: "find"
			},
			create: {
				parameter: [
					{
						description: "data"
					},
					{
						description: "params"
					}
				],
				summary: "create"
			},
			remove: {
				parameter: [
					{
						description: "id"
					},
					{
						description: "params"
					}
				],
				summary: "remove"
			}
		},
		callbackService: {
			create: {
				parameter: [
					{
						description: "data"
					},
					{
						description: "params"
					}
				],
				summary: "create"
			}
		}
	}
};
