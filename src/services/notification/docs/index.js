module.exports = {
	notificationService: {
		description: "A service for notifications",
		get: {
			parameter: [
				{
					description: "notification id",
					required: true,
					name: "id",
					type: "id"
				},
				{
					description: "params",
					required: true,
					name: "params",
					type: "params"
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
						description: "data",
						required: true,
						name: "data",
						type: "data"
					},
					{
						description:
							"params including an account and a payload",
						required: true,
						name: "params",
						type: "params"
					}
				],
				summary: "create"
			},
			get: {
				parameter: [
					{
						description: "id",
						required: true,
						name: "id",
						type: "id"
					},
					{
						description:
							"params including an account and a payload",
						required: true,
						name: "params",
						type: "params"
					}
				],
				summary: "get"
			}
		},
		deviceService: {
			find: {
				parameter: [
					{
						description: "params",
						required: true,
						name: "params",
						type: "params"
					}
				],
				summary: "find, returns devices"
			},
			create: {
				parameter: [
					{
						description: "data",
						required: true,
						name: "data",
						type: "data"
					},
					{
						description: "params",
						required: true,
						name: "params",
						type: "params"
					}
				],
				summary: "create"
			},
			remove: {
				parameter: [
					{
						description: "device id",
						required: true,
						name: "id",
						type: "id"
					},
					{
						description: "params",
						required: true,
						name: "params",
						type: "params"
					}
				],
				summary: "remove"
			}
		},
		callbackService: {
			create: {
				parameter: [
					{
						description: "data",
						required: true,
						name: "data",
						type: "data"
					},
					{
						description: "params",
						required: true,
						name: "params",
						type: "params"
					}
				],
				summary: "create"
			}
		}
	}
};
