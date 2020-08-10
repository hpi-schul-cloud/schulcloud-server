module.exports = {
	wopiFilesInfoService: {
		description:
			'A service to get files specific information for a wopi client',
		find: {
			parameters: [
				{
					description: 'the id of the virtual file',
					required: true,
					name: 'fileId',
					in: 'path',
					type: 'string',
				},
			],
			summary: 'Return wopi-specific file information for a given file',
		},
		create: {
			parameters: [
				{
					description: 'the id of the virtual file',
					required: true,
					name: 'fileId',
					in: 'path',
					type: 'string',
				},
				{
					description: 'the action which should be triggered',
					required: true,
					name: 'X-WOPI-OVERRIDE',
					in: 'header',
					type: 'string',
				},
			],
			summary:
				'Triggers a specific wopi action for a given X-WOPI-OVERRIDE value',
		},
	},
	wopiFilesContentsService: {
		description:
			'A service for handling the wopi GetFile & PutFile operation',
		create: {
			parameters: [
				{
					description: 'the id of the virtual file',
					required: true,
					name: 'fileId',
					in: 'path',
					type: 'string',
				},
			],
			summary: 'uploads the binary data to the file storage',
		},
		find: {
			parameters: [
				{
					description: 'the id of the virtual file',
					required: true,
					name: 'fileId',
					in: 'path',
					type: 'string',
				},
			],
			summary: 'Retrieves the binary data of the requested file',
		},
	},
};
