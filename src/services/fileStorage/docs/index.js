module.exports = {
	fileStorageService: {
		description: 'A service to handle external file storages',
		create: {
			parameters: [
				{
					description: 'the id of the school for which the storage will be created',
					required: true,
					name: 'schoolId',
					type: 'string'
				}
			],
			summary: 'Creates a new storage environment for a given school',
			notes: 'Returns meta data of the created storage'
		},
		find: {
			parameters: [
				{
					description: 'the context of the file-storage',
					required: true,
					name: 'path',
					type: 'string'
				}
			],
			summary: 'Retrieve all files and immediate sub-directories for the given path'
		},
		remove: {
			parameters: [
				{
					description: 'The path where the file can be found',
					required: true,
					name: 'path',
					type: 'string'
				}
			],
			summary: 'remove a file'
		},
		patch: {
			parameters: [
				{
					description: 'The name of the file',
					required: true,
					name: 'fileName',
					type: 'string'
				},
				{
					description: 'The path where the file can be found, have to have a slash at the end',
					required: true,
					name: 'path',
					type: 'string'
				},
				{
					description: 'The path where the file should be moved to, have to have a slash at the end',
					required: true,
					name: 'destination',
					type: 'string'
				},
				{
					description: 'The id of the file in the proxy db',
					required: true,
					name: 'id',
					type: 'string'
				}
			],
			summary: 'moves a file to a new path'
		},
	},
	directoryService: {
		description: 'A service for handling directories',
		create: {
			parameters: [
				{
					description: 'the path of the directory to be created',
					required: true,
					name: 'path',
					type: 'string'
				}
			],
			summary: 'Creates a folder for a given path'
		},
		remove: {
			parameters: [
				{
					description: 'the path of the directory to be removed',
					required: true,
					name: 'path',
					type: 'string'
				}
			],
			summary: 'Removes a folder for a given storageContext'
		}
	},
	signedUrlService: {
		description: 'A service for generating signed urls, e.g. for uploading (action = putObject) and downloading files (action = getObject)',
		create: {
			parameters: [
				{
					description: 'The path where the file can be found/should be created',
					required: true,
					name: 'path',
					type: 'string'
				},
				{
					description: 'the mime type of the file that will be uploaded',
					required: true,
					name: 'fileType',
					type: 'string'
				},
				{
					description: 'What the signed URL should be for, e.g. downloading (getObject) or uploading (putObject)',
					required: true,
					name: 'action',
					type: 'string'
				}
			],
			summary: 'Creates a new signed url for the given file information and path, e.g. for uploading or downloading',
			notes: 'Returns a url as string'
		}
	}
};
