import { MessageSchema } from '../schema-registry.service';

// Schema for CopyFilesOfParentParams
const copyFilesOfParentParamsSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string' },
		source: {
			type: 'object',
			properties: {
				storageLocationId: { type: 'string' },
				storageLocation: { type: 'string', enum: ['S3', 'LOCAL'] },
				parentId: { type: 'string' },
				parentType: { type: 'string' },
			},
			required: ['storageLocationId', 'storageLocation', 'parentId', 'parentType'],
			additionalProperties: false,
		},
		target: {
			type: 'object',
			properties: {
				storageLocationId: { type: 'string' },
				storageLocation: { type: 'string', enum: ['S3', 'LOCAL'] },
				parentId: { type: 'string' },
				parentType: { type: 'string' },
			},
			required: ['storageLocationId', 'storageLocation', 'parentId', 'parentType'],
			additionalProperties: false,
		},
	},
	required: ['userId', 'source', 'target'],
	additionalProperties: false,
};

// Schema for simple parent params (used in list, delete operations)
const fileRecordParamsSchema = {
	type: 'object',
	properties: {
		storageLocationId: { type: 'string' },
		storageLocation: { type: 'string', enum: ['S3', 'LOCAL'] },
		parentId: { type: 'string' },
		parentType: { type: 'string' },
	},
	required: ['storageLocationId', 'storageLocation', 'parentId', 'parentType'],
	additionalProperties: false,
};

// Schema for file deletion by IDs
const deleteFilesParamsSchema = {
	type: 'object',
	properties: {
		fileIds: {
			type: 'array',
			items: { type: 'string' },
			minItems: 1,
		},
	},
	required: ['fileIds'],
	additionalProperties: false,
};

// Schema for removing creator ID
const removeCreatorIdParamsSchema = {
	type: 'object',
	properties: {
		creatorId: { type: 'string' },
	},
	required: ['creatorId'],
	additionalProperties: false,
};

export const filesStorageSchemas: MessageSchema[] = [
	{
		id: 'copy-files-of-parent-v1',
		version: '1.0.0',
		exchange: 'files-storage',
		event: 'copy-files-of-parent',
		schema: copyFilesOfParentParamsSchema,
		description: 'Copy files from one parent to another',
		createdAt: new Date(),
	},
	{
		id: 'list-files-of-parent-v1',
		version: '1.0.0',
		exchange: 'files-storage',
		event: 'list-files-of-parent',
		schema: fileRecordParamsSchema,
		description: 'List files of a specific parent',
		createdAt: new Date(),
	},
	{
		id: 'delete-files-of-parent-v1',
		version: '1.0.0',
		exchange: 'files-storage',
		event: 'delete-files-of-parent',
		schema: fileRecordParamsSchema,
		description: 'Delete all files of a specific parent',
		createdAt: new Date(),
	},
	{
		id: 'delete-files-v1',
		version: '1.0.0',
		exchange: 'files-storage',
		event: 'delete-files',
		schema: deleteFilesParamsSchema,
		description: 'Delete specific files by their IDs',
		createdAt: new Date(),
	},
	{
		id: 'remove-creatorid-of-files-v1',
		version: '1.0.0',
		exchange: 'files-storage',
		event: 'remove-creatorId-of-files',
		schema: removeCreatorIdParamsSchema,
		description: 'Remove creator ID from files',
		createdAt: new Date(),
	},
];
