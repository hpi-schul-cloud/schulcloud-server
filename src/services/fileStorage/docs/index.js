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
	fileRenameService: {
		description: 'A service that handles renaming a file',
		create: {
			parameters: [
				{
					description: 'the path of the file to be renamed',
					required: true,
					name: 'path',
					in: 'body',
					type: 'string'
				},
				{
					description: 'the new name for the file to be renamed',
					required: true,
					name: 'newName',
					in: 'body',
					type: 'string'
				}
			],
			summary: 'Renames a given file, modifies lessons which include the renamed file'
		},
	},
	directoryRenameService: {
		description: 'A service that handles renaming a virtual directory',
		create: {
			parameters: [
				{
					description: 'the path of the directory to be renamed',
					required: true,
					name: 'path',
					in: 'body',
					type: 'string'
				},
				{
					description: 'the new name for the directory to be renamed',
					required: true,
					name: 'newName',
					in: 'body',
					type: 'string'
				}
			],
			summary: 'Renames a given directory, also recursively sub-directories and files'
		},
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
	},
	copyService: {
		description: 'A service for copying files',
		patch: {
			parameters: [
				{
					description: 'The path where the file can be found/should be created',
					required: true,
					name: 'oldPath',
					type: 'string',
					in: 'body'
				},
				{
					description: 'The path where the copied file should be stored',
					required: true,
					name: 'newPath',
					type: 'string',
					in: 'body'
				},
				{
					description: 'The name of the file which will be copied',
					required: true,
					name: 'fileName',
					type: 'string',
					in: 'body'
				},
				{
					description: 'Indicates the school-bucket, if the file is stored in an other school',
					required: false,
					name: 'externalSchoolId',
					type: 'string',
					in: 'body'
				}
			],
			summary: 'Copies a file from a given path to a new file'
		}
	}
};
