import { MessageSchema } from '../schema-registry.service';

// Schema for group provisioning message
const groupProvisioningMessageSchema = {
	type: 'object',
	properties: {
		externalGroup: {
			type: 'object',
			properties: {
				externalId: { type: 'string' },
				name: { type: 'string' },
				type: { type: 'string', nullable: true },
				users: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							externalUserId: { type: 'string' },
							roleName: { type: 'string' },
						},
						required: ['externalUserId', 'roleName'],
						additionalProperties: true,
					},
				},
				otherUsers: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							externalUserId: { type: 'string' },
							roleName: { type: 'string' },
						},
						required: ['externalUserId', 'roleName'],
						additionalProperties: true,
					},
					nullable: true,
				},
			},
			required: ['externalId', 'name', 'users'],
			additionalProperties: true,
		},
		externalSchool: {
			type: 'object',
			properties: {
				externalId: { type: 'string' },
				name: { type: 'string' },
				official_school_number: { type: 'string', nullable: true },
			},
			required: ['externalId', 'name'],
			additionalProperties: true,
			nullable: true,
		},
		systemId: { type: 'string' },
	},
	required: ['externalGroup', 'systemId'],
	additionalProperties: false,
};

// Schema for group removal message
const groupRemovalMessageSchema = {
	type: 'object',
	properties: {
		externalGroupId: { type: 'string' },
		systemId: { type: 'string' },
		externalUserId: { type: 'string' },
	},
	required: ['externalGroupId', 'systemId', 'externalUserId'],
	additionalProperties: false,
};

// Schema for license provisioning message
const licenseProvisioningMessageSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string' },
		schoolId: { type: 'string' },
		systemId: { type: 'string' },
		externalLicenses: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					licenseId: { type: 'string' },
					productId: { type: 'string' },
					mediumId: { type: 'string', nullable: true },
					utilizationSystems: {
						type: 'array',
						items: { type: 'string' },
						nullable: true,
					},
					validFrom: { type: 'string', format: 'date-time', nullable: true },
					validUntil: { type: 'string', format: 'date-time', nullable: true },
				},
				required: ['licenseId', 'productId'],
				additionalProperties: true,
			},
		},
	},
	required: ['userId', 'schoolId', 'systemId', 'externalLicenses'],
	additionalProperties: false,
};

export const schulconnexProvisioningSchemas: MessageSchema[] = [
	{
		id: 'schulconnex-group-provisioning-v1',
		version: '1.0.0',
		exchange: 'schulconnex-provisioning',
		event: 'schulconnex-group-provisioning',
		schema: groupProvisioningMessageSchema,
		description: 'Provision a Schulconnex group',
		createdAt: new Date(),
	},
	{
		id: 'schulconnex-group-removal-v1',
		version: '1.0.0',
		exchange: 'schulconnex-provisioning',
		event: 'schulconnex-group-removal',
		schema: groupRemovalMessageSchema,
		description: 'Remove a user from a Schulconnex group',
		createdAt: new Date(),
	},
	{
		id: 'schulconnex-license-provisioning-v1',
		version: '1.0.0',
		exchange: 'schulconnex-provisioning',
		event: 'schulconnex-license-provisioning',
		schema: licenseProvisioningMessageSchema,
		description: 'Provision Schulconnex licenses for a user',
		createdAt: new Date(),
	},
];
