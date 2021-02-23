module.exports = {
	description: 'a service that handles storing and validating user consents',
	definitions: {
		consents: {
			title: 'Consents',
			type: 'object',
			required: ['firstName', 'lastName', 'email', 'schoolId'],
			properties: {
				userId: {
					type: 'string',
					pattern: '[a-f0-9]{24}',
				},
				userConsent: {
					type: 'object',
					properties: {
						form: {
							type: 'string',
							enum: ['analog', 'digital', 'update'],
						},
						source: {
							type: 'string',
						},
						dateOfPrivacyConsent: {
							type: 'string',
							format: 'date',
							readOnly: true,
						},
						dateOfTermsOfUseConsent: {
							type: 'string',
							format: 'date',
							readOnly: true,
						},
						privacyConsent: { type: 'boolean' },
						termsOfUseConsent: { type: 'boolean' },
					},
				},
				parentConsents: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							form: {
								type: 'string',
								enum: ['analog', 'digital', 'update'],
							},
							source: {
								type: 'string',
							},
							parentId: {
								type: 'string',
								pattern: '[a-f0-9]{24}',
							},
							dateOfPrivacyConsent: {
								type: 'string',
								format: 'date',
								readOnly: true,
							},
							dateOfTermsOfUseConsent: {
								type: 'string',
								format: 'date',
								readOnly: true,
							},
							privacyConsent: { type: 'boolean' },
							termsOfUseConsent: { type: 'boolean' },
						},
					},
				},
				access: { type: 'boolean', readOnly: true },
				requiresParentConsent: { type: 'boolean', readOnly: true },
			},
		},
		consents_list: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: {
						$ref: '#/components/schemas/consents',
					},
				},
				total: { type: 'integer' },
				limit: { type: 'integer' },
				skip: { type: 'integer' },
			},
		},
	},
	operations: {
		create: {
			description: 'If the user already has a consent, it is updated.',
		},
	},
};
