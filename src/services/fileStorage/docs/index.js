/* eslint max-len: 0 */
module.exports = {
	fileStorageService: {
		description: '',
		operations: {
			create: {
				parameters: [
					{
						description: 'Filename',
						name: 'name',
						type: 'String',
						required: true,
					},
					{
						description: 'ID of either an course or team. For user files leave out.',
						type: 'String (ObjectID)',
						name: 'owner',
					},
					{
						description: 'ID of parent folder',
						type: 'String (ObjectID)',
						name: 'parent',
					},
					{
						description: 'Mimetype of file',
						type: 'String',
						name: 'type',
					},
					{
						description: 'Filesize in Byte',
						name: 'size',
						type: 'Number',
						schema: {
							type: 'integer',
							format: 'int32',
							minimum: 0,
						},
					},
					{
						description: 'Filename aka identifier in storage context',
						name: 'storageFileName',
						type: 'String',
						required: true,
						schema: {
							type: 'string',
						},
					},
					{
						description: 'Thumbnail of file',
						type: 'String',
						name: 'thumbnail',
					},
					{
						description: 'Determine if students can edit if file is a course file',
						type: 'Boolean',
						name: 'studentCanEdit',
						schema: {
							type: 'boolean',
						},
					},
					{
						description: 'Override default permissions on creation',
						name: 'permissions',
						type: 'Array',
						style: 'matrix',
						explode: true,
						schema: {
							type: 'array',
							items: {
								type: 'object',
							},
						},
					},
				],
				description: '',
				summary: 'Creates a new file object',
				responses: {
					200: {
						description: 'Returns the data of the newly created file',
						example: {
							name: '24-1.gif',
							owner: '0000dcfbfb5c7a3f00bf21ab',
							type: 'image/gif',
							size: 2545,
							storageFileName: '1560977688023-24-1.gif',
							thumbnail: 'https://schulcloud.org/images/login-right.png',
							parent: '5c6490eeb07d3c7eacedc9a8',
							refOwnerModel: 'course',
							_id: '5d0aa11841ff829edda019c8',
							updatedAt: '2019-05-29T10:54:48.987Z',
							createdAt: '2019-05-29T10:54:48.987Z',
							permissions: [
								{
									refId: '0000d231816abba584714c9e',
									refPermModel: 'user',
									delete: true,
									create: true,
									read: true,
									write: true,
								},
								{
									refId: '0000d186816abba584714c99',
									refPermModel: 'role',
									delete: false,
									create: false,
									read: true,
									write: false,
								},
								{
									refId: '0000d186816abba584714c98',
									refPermModel: 'role',
									delete: false,
									create: false,
									read: true,
									write: true,
								},
							],
							isDirectory: false,
						},
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
			find: {
				description: '',
				summary: 'Retrieve all files and directories of given owner and parent folder',
				parameters: [
					{
						in: 'query',
						description: 'ID of either an user, course or team',
						type: 'String (ObjectID)',
						name: 'owner',
						required: true,
					},
					{
						in: 'query',
						description: 'ID of parent folder',
						type: 'String (ObjectID)',
						name: 'parent',
					},
				],
				responses: {
					200: {
						description: 'Returns an array of all files ',
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
			remove: {
				parameters: [
					{
						description: 'File ID to be deleted',
						required: true,
						name: '_id',
						in: 'query',
						type: 'String (ObjectID)',
					},
					{
						description: 'File ID to be deleted',
						name: 'id',
						in: 'path',
						type: 'String (ObjectID)',
					},
				],
				description: '',
				summary: 'Removes the file with given Object ID either in query or path',
				responses: {
					200: {
						description: 'OK - file deleted',
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
			patch: {
				parameters: [
					{
						description: 'File ID to be moved',
						required: true,
						name: 'id',
						in: 'query',
						type: 'String (ObjectID)',
					},
					{
						description: 'File ID to be moved',
						name: 'id',
						in: 'path',
						type: 'String (ObjectID)',
					},
					{
						description: 'ID of parent folder or team/course/user',
						type: 'String (ObjectID)',
						name: 'parent',
					},
				],
				description: '',
				summary: 'Moves a file with given Object ID either in query or path to a new destination',
				responses: {
					200: {
						description: 'OK - file moved',
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
	directoryService: {
		description: '',
		operations: {
			find: {
				description: '',
				summary: 'Get all directories',
				parameters: [
					{
						description: 'Optional Subfolder',
						name: 'parent',
						in: 'query',
						type: 'String (ObjectID)',
					},
				],
				responses: {
					200: {
						description: 'Returns an array of the directory objects',
						example: [
							{
								name: 'Lehrertest',
								owner: '0000dcfbfb5c7a3f00bf21ab',
								refOwnerModel: 'course',
								_id: '5d0f65eed5aa885773d402c4',
								updatedAt: '2019-05-23T11:43:42.206Z',
								createdAt: '2019-05-23T11:43:42.206Z',
								permissions: [
									{
										refId: '0000d231816abba584714c9e',
										refPermModel: 'user',
										delete: true,
										create: true,
										read: true,
										write: true,
									},
									{
										refId: '0000d186816abba584714c99',
										refPermModel: 'role',
										delete: false,
										create: true,
										read: true,
										write: false,
									},
								],
								isDirectory: true,
							},
							{
								name: 'Lehrertest2',
								owner: '0000dcfbfb5c7a3f00bf21ab',
								refOwnerModel: 'course',
								_id: '5d0f65eed5aa885773d402c3',
								updatedAt: '2019-05-23T11:53:14.206Z',
								createdAt: '2019-05-23T11:53:14.206Z',
								permissions: [
									{
										refId: '0000d231816abba584714c9e',
										refPermModel: 'user',
										delete: true,
										create: true,
										read: true,
										write: true,
									},
									{
										refId: '0000d186816abba584714c99',
										refPermModel: 'role',
										delete: false,
										create: true,
										read: true,
										write: false,
									},
								],
								isDirectory: true,
							},
						],
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
			create: {
				parameters: [
					{
						description: 'Directory name',
						name: 'name',
						type: 'String',
						required: true,
					},
					{
						description: 'ID of either an course or team. For user dirs leave out.',
						type: 'String (ObjectID)',
						name: 'owner',
					},
					{
						description: 'ID of parent folder',
						type: 'String (ObjectID)',
						name: 'parent',
					},
					{
						description: 'Override default permissions on creation',
						name: 'permissions',
						type: 'Array',
						style: 'matrix',
						explode: true,
						schema: {
							type: 'array',
							items: {
								type: 'object',
							},
						},
					},
				],
				description: '',
				summary: 'Creates a new directory object',
				responses: {
					200: {
						description: 'Returns the data of the newly created directory',
						example: {
							name: 'Lehrertest',
							owner: '0000dcfbfb5c7a3f00bf21ab',
							refOwnerModel: 'course',
							_id: '5d0f65eed5aa885773d402c4',
							updatedAt: '2019-05-23T11:43:42.206Z',
							createdAt: '2019-05-23T11:43:42.206Z',
							permissions: [
								{
									refId: '0000d231816abba584714c9e',
									refPermModel: 'user',
									delete: true,
									create: true,
									read: true,
									write: true,
								},
								{
									refId: '0000d186816abba584714c99',
									refPermModel: 'role',
									delete: false,
									create: true,
									read: true,
									write: false,
								},
							],
							isDirectory: true,
						},
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
			remove: {
				parameters: [
					{
						description: 'File ID to be deleted',
						required: true,
						name: '_id',
						in: 'query',
						type: 'String (ObjectID)',
					},
				],
				description: '',
				summary: 'Removes the directory with given Object ID',
				responses: {
					200: {
						description: 'OK - file deleted',
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
	renameService: {
		description: 'A service that handles renaming a files/directories',
		operations: {
			create: {
				parameters: [
					{
						description: 'Object-ID of file object to be renamed',
						required: true,
						name: 'id',
						type: 'string',
					},
					{
						description: 'The new name for the file object to be renamed',
						required: true,
						name: 'newName',
						type: 'string',
					},
				],
				description: '',
				summary: 'Renames a given directory or file',
				responses: {
					200: {
						description: 'OK - file object renamed',
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
	fileTotalSizeService: {
		description: '',
		summary: 'A service for getting file sizes',
		operations: {
			find: {
				description: '',
				summary: 'Gets total size of all files',
				parameters: [],
				responses: {
					200: {
						description: 'Returns file statistics',
						example: {
							total: 112,
							totalSize: 548000,
						},
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
	signedUrlService: {
		description: '',
		summary:
			'A service for generating signed urls, e.g. for uploading (action = putObject) and downloading files (action = getObject)',
		operations: {
			create: {
				parameters: [
					{
						description: 'The path where the file can be found/should be created',
						required: true,
						name: 'filename',
						type: 'string',
					},
					{
						description: 'the mime type of the file that will be uploaded',
						required: true,
						name: 'fileType',
						type: 'string',
					},
					{
						description: 'ID of parent folder',
						type: 'String (ObjectID)',
						name: 'parent',
					},
				],
				description: '',
				summary: 'Creates a new signed url for the given file information',
				responses: {
					200: {
						description: 'Returns the data signed url and meta properties',
						example: {
							signedUrl: {
								url: 'https://<url>:<port>/bucket-5f2987e020834114b8efd6f8/1561200908775-24-1.gif?Content-Type=image%2Fgif&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=sc-devteam%2F20190622%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20190622T105509Z&X-Amz-Expires=60&X-Amz-Signature=b098d101dea55fc3a8fa1e9accf4c99807e96ab22a91f3ee162e86c850e6a164&X-Amz-SignedHeaders=host',
								header: {
									'Content-Type': 'image/gif',
									'x-amz-meta-name': '24-1.gif',
									'x-amz-meta-flat-name': '1561200908775-24-1.gif',
								},
							},
						},
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
			find: {
				description: '',
				summary: 'Request a signed url for downloading a file',
				parameters: [
					{
						description: 'File ID to get signed url for',
						name: 'file',
						in: 'query',
						type: 'String (ObjectID)',
					},
					{
						description: 'If true sets the ResponseContentDisposition-Header for the returned signed Url',
						name: 'download',
						in: 'query',
						type: 'Boolean',
					},
				],
				responses: {
					200: {
						description: 'Returns the data with the signed url',
						example: {
							signedUrl: {
								url: 'https://<url>:<port>/bucket-5f2987e020834114b8efd6f8/1561200908775-24-1.gif?Content-Type=image%2Fgif&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=sc-devteam%2F20190622%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20190622T105509Z&X-Amz-Expires=60&X-Amz-Signature=b098d101dea55fc3a8fa1e9accf4c99807e96ab22a91f3ee162e86c850e6a164&X-Amz-SignedHeaders=host',
							},
						},
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
			patch: {
				parameters: [
					{
						description: 'File ID to be updated',
						name: 'id',
						in: 'path',
						type: 'String (ObjectID)',
					},
				],
				description: '',
				summary: 'Request a signed url for updating the content of an already existing file',
				responses: {
					200: {
						description: 'Returns the data with the signed url',
						example: {
							signedUrl: {
								url: 'https://<url>:<port>/bucket-5f2987e020834114b8efd6f8/1561200908775-24-1.gif?Content-Type=image%2Fgif&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=sc-devteam%2F20190622%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20190622T105509Z&X-Amz-Expires=60&X-Amz-Signature=b098d101dea55fc3a8fa1e9accf4c99807e96ab22a91f3ee162e86c850e6a164&X-Amz-SignedHeaders=host',
							},
						},
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
	bucketService: {
		description: 'A service for creating a buckets',
		operations: {
			create: {
				description: '',
				summary: 'Create a bucket for given school',
				parameters: [
					{
						description: 'ID of school',
						required: true,
						type: 'string',
						in: 'body',
						name: 'parent',
						example: '5f2987e020834114b8efd6f7',
					},
				],
				responses: {
					200: {
						description: 'OK - bucket created',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
	copyService: {
		description: 'A service for copying files',
		operations: {
			create: {
				description: '',
				summary: 'Copy a file to a new destination',
				parameters: [
					{
						description: 'File ID to copy',
						required: true,
						name: 'file',
						in: 'body',
						type: 'string',
						example: '5c6490eeb07d3c7eacedc9aa',
					},
					{
						description: 'ID of new parent folder',
						required: true,
						name: 'parent',
						in: 'body',
						type: 'string',
						example: '5d0f65eed5aa885773d402c4',
					},
				],
				responses: {
					200: {
						description: 'Returns the data of the copy.',
						example: {
							name: '24-1.gif',
							owner: '0000dcfbfb5c7a3f00bf21ab',
							type: 'image/gif',
							size: 2545,
							storageFileName: '1560977688023-24-1.gif',
							thumbnail: 'https://schulcloud.org/images/login-right.png',
							parent: '5d0f65eed5aa885773d402c4',
							refOwnerModel: 'course',
							_id: '5d0aa11841ff829edda019c8',
							updatedAt: '2019-05-29T10:54:48.987Z',
							createdAt: '2019-05-29T10:54:48.987Z',
							permissions: [
								{
									refId: '0000d231816abba584714c9e',
									refPermModel: 'user',
									delete: true,
									create: true,
									read: true,
									write: true,
								},
								{
									refId: '0000d186816abba584714c99',
									refPermModel: 'role',
									delete: false,
									create: false,
									read: true,
									write: false,
								},
								{
									refId: '0000d186816abba584714c98',
									refPermModel: 'role',
									delete: false,
									create: false,
									read: true,
									write: true,
								},
							],
							isDirectory: false,
						},
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
	newFileService: {
		description: 'A service for creating new files',
		operations: {
			create: {
				summary: 'Creating a new empty file',
				description:
					'This service lets you create an new empty file. Right now the following file types are supported: .pptx, .xlsx, .docx',
				parameters: [
					{
						description: 'Filename',
						name: 'name',
						type: 'String',
						required: true,
					},
					{
						description: 'ID of either an course or team. For user files leave out.',
						type: 'String (ObjectID)',
						name: 'owner',
					},
					{
						description: 'ID of parent folder',
						type: 'String (ObjectID)',
						name: 'parent',
					},
					{
						description: 'Determine if students can edit if file is a course file',
						type: 'Boolean',
						name: 'studentCanEdit',
						schema: {
							type: 'boolean',
						},
					},
				],
				responses: {
					200: {
						description: 'Returns the data of the newly created file',
						example: {
							_id: '5d0aa11841ff829edda019c8',
							name: '1542141103353-praesi.docx',
							owner: '5c1a4fba954956c51f6de53c',
							type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
							size: 0,
							storageFileName: '1554392225392-1542141103353-praesi.docx',
							thumbnail: 'https://schulcloud.org/images/login-right.png',
							parent: '5c6490eeb07d3c7eacedc9a8',
							refOwnerModel: 'course',
							updatedAt: '2019-04-04T15:37:06.201Z',
							createdAt: '2019-04-04T15:37:06.201Z',
							permissions: [
								{
									refId: '0000d231816abba584714c9e',
									refPermModel: 'user',
									delete: true,
									create: true,
									read: true,
									write: true,
								},
								{
									refId: '0000d186816abba584714c99',
									refPermModel: 'role',
									delete: false,
									create: false,
									read: true,
									write: false,
								},
								{
									refId: '0000d186816abba584714c98',
									refPermModel: 'role',
									delete: false,
									create: false,
									read: true,
									write: true,
								},
							],
							isDirectory: false,
						},
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
	permissionService: {
		description: 'A service for handling file permissions',
		operations: {
			patch: {
				description: '',
				summary: 'Update permissions of a single file',
				parameters: [
					{
						description: 'Object-ID of file object',
						required: true,
						name: 'id',
						in: 'path',
						type: 'string',
					},
					{
						description: 'Permissions for the file/directory',
						required: true,
						name: 'permissions',
						in: 'body',
						type: 'array',
						example: [
							{
								refId: '5bb5c391fb457b1c3c0c7e10',
								read: 'true',
								write: 'true',
							},
							{
								refId: '5bb5c190fb457b1c3c0c7e0f',
								read: 'true',
							},
						],
					},
				],
				responses: {
					200: {
						description: 'OK - file permissions updated',
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
			find: {
				description: '',
				summary:
					'Returns the permissions of a file filtered by owner model and permissions based on the role of the user',
				parameters: [
					{
						description: 'File ID to copy',
						required: true,
						name: 'file',
						in: 'query',
						type: 'string',
						example: '5cf932b42b3ca8c8c87e191d',
					},
				],
				responses: {
					200: {
						example: [
							{
								refId: '5bb5c190fb457b1c3c0c7e0f',
								name: 'teammember',
								read: true,
								write: false,
							},
							{
								refId: '5bb5c391fb457b1c3c0c7e10',
								name: 'teamexpert',
								read: true,
								write: false,
							},
							{
								refId: '5bb5c49efb457b1c3c0c7e11',
								name: 'teamleader',
								read: true,
								write: true,
							},
							{
								refId: '5bb5c545fb457b1c3c0c7e13',
								name: 'teamadministrator',
								read: true,
								write: true,
							},
							{
								refId: '5bb5c62bfb457b1c3c0c7e14',
								name: 'teamowner',
								write: true,
							},
						],
					},
					403: {
						description: 'File operation is forbidden due to missing permissions',
					},
					404: {
						description: 'File not found',
					},
					500: {
						description: 'Error performing operation',
					},
				},
			},
		},
	},
};
