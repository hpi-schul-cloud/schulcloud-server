import { MessageSchema } from '../schema-registry.service';

const deleteContentParamsSchema = {
	type: 'object',
	properties: {
		contentId: { type: 'string' },
	},
	required: ['contentId'],
	additionalProperties: false,
};

const copyContentParamsSchema = {
	type: 'object',
	properties: {
		sourceContentId: { type: 'string' },
		copiedContentId: { type: 'string' },
		userId: { type: 'string' },
		schoolId: { type: 'string' },
		parentType: {
			type: 'string',
			enum: ['lessons', 'board-element'],
		},
		parentId: { type: 'string' },
	},
	required: ['sourceContentId', 'copiedContentId', 'userId', 'schoolId', 'parentType', 'parentId'],
	additionalProperties: false,
};

export const h5pEditorSchemas: MessageSchema[] = [
	{
		id: 'delete-content-v1',
		version: '1.0.0',
		exchange: 'h5p-editor',
		event: 'delete-content',
		schema: deleteContentParamsSchema,
		description: 'Delete H5P content',
		createdAt: new Date(),
	},
	{
		id: 'copy-content-v1',
		version: '1.0.0',
		exchange: 'h5p-editor',
		event: 'copy-content',
		schema: copyContentParamsSchema,
		description: 'Copy H5P content',
		createdAt: new Date(),
	},
];
