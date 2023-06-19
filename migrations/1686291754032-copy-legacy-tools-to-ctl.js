/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error, info } = require('../src/logger');

const { Schema } = mongoose;

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

const LtiTool = mongoose.model(
	'ltitool0906202311481',
	new mongoose.Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			name: { type: String, required: true },
			url: { type: String, required: true },
			key: { type: String },
			secret: { type: String, required: true, default: 'none' },
			logo_url: { type: String },
			lti_message_type: { type: String },
			lti_version: { type: String },
			resource_link_id: { type: String },
			roles: {
				type: String,
				enum: ['Learner', 'Instructor', 'ContentDeveloper', 'Administrator', 'Mentor', 'TeachingAssistant'],
			},
			privacy_permission: {
				type: String,
				enum: ['anonymous', 'e-mail', 'name', 'public', 'pseudonymous'],
				required: true,
				default: 'anonymous',
			},
			customs: [{ type: { key: { type: String }, value: { type: String } } }],
			isTemplate: { type: Boolean, required: true, default: false },
			isLocal: { type: Boolean },
			_originTool: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
			oAuthClientId: { type: String },
			friendlyUrl: { type: String, unique: true, sparse: true },
			skipConsent: { type: Boolean },
			openNewTab: { type: Boolean, required: true, default: false },
			frontchannel_logout_uri: { type: String },
			isHidden: { type: Boolean, required: true, default: false },
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
		},
		{
			timestamps: true,
		}
	),
	'ltitools'
);

const ExternalTool = mongoose.model(
	'external_tool0906202311482',
	new mongoose.Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			name: { type: String, unique: true },
			url: { type: String },
			logoUrl: { type: String },

			// basic Config
			config_type: { type: String },
			config_baseUrl: { type: String },
			// Outh Config
			config_clientId: { type: String },
			config_skipConsent: { type: Boolean },
			// Lti Config
			key: { type: String, required: true },
			secret: { type: String },
			resource_link_id: { type: String },
			lti_message_type: { type: String },
			privacy_permission: {
				type: String,
				enum: ['anonymous', 'e-mail', 'name', 'public', 'pseudonymous'],
				required: true,
				default: 'anonymous',
			},
			// config: { type: mongoose.Schema.Types.Mixed }

			parameters: [
				{
					type: {
						name: { type: String, required: true },
						displayName: { type: String, required: true },
						description: { type: String },
						default: { type: String },
						regex: { type: String },
						regexComment: { type: String },
						scope: {
							type: String,
							enum: ['global', 'school', 'context'],
							required: true,
						},
						location: {
							type: String,
							enum: ['path', 'body', 'query'],
							required: true,
						},
						type: {
							type: String,
							enum: ['string', 'number', 'boolean', 'auto_courseid', 'auto_coursename', 'auto_schoolid'],
							required: true,
						},
						isOptional: { type: Boolean, required: true },
					},
				},
			],

			isHidden: { type: Boolean, required: true },
			openNewTab: { type: Boolean, required: true },
			version: { type: Number, required: true },
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
		},
		{
			timestamps: true,
		}
	),
	'external_tools'
);

const SchoolExternalTool = mongoose.model(
	'school_external_tool0906202311483',
	new mongoose.Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			tool: { type: Schema.Types.ObjectId, ref: 'externalTool', required: true },
			school: { type: Schema.Types.ObjectId, ref: 'school', required: true },
			schoolParameters: [{ type: { key: { type: String }, value: { type: String } } }],
			toolVersion: { type: Number, required: true },
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
		},
		{
			timestamps: true,
		}
	),
	'school_external_tools'
);

const ContextExternalTool = mongoose.model(
	'context_external_tool0906202311484',
	new mongoose.Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			schoolTool: { type: Schema.Types.ObjectId, ref: 'schoolExternalTool', required: true },
			contextId: { type: Schema.Types.ObjectId, required: true },
			contextType: { type: String, enum: ['course'], required: true },
			contextToolName: { type: String },
			parameters: [{ type: { key: { type: String }, value: { type: String } } }],
			toolVersion: { type: Number, required: true },
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
		},
		{
			timestamps: true,
		}
	),
	'context_external_tools'
);

function mapToExternalToolParameter(ltiToolTemplate, scope, location) {
	return ltiToolTemplate.customs.map((parameter) => {
		return {
			name: parameter.key,
			displayName: parameter.key,
			description: '',
			default: parameter.value,
			regex: '',
			regexComment: '',
			scope,
			location,
			type: 'string',
			isOptional: true,
		};
	});
}

function mapToCustomParameterEntry(externalToolParameters, ltiToolCustomes) {
	return externalToolParameters.map((parameter, index) => {
		return {
			name: parameter.name,
			value: ltiToolCustomes[index].value,
		};
	});
}

function mapToExternalTool(ltiToolTemplate) {
	let toolConfig = {};

	if (ltiToolTemplate.oAuthClientId) {
		toolConfig = {
			config_type: 'oauth2',
			config_baseUrl: ltiToolTemplate.url,
			config_clientId: ltiToolTemplate.oAuthClientId,
			config_skipConsent: ltiToolTemplate.skipConsent,
		};
	} else if (ltiToolTemplate.key || ltiToolTemplate.key !== 'none') {
		toolConfig = {
			config_type: 'lti11',
			config_baseUrl: ltiToolTemplate.url,
			key: ltiToolTemplate.key,
			secret: ltiToolTemplate.secret,
			ressource_link_id: ltiToolTemplate.ressource_link_id,
			lti_message_type: ltiToolTemplate.lti_message_type,
			privacy_permission: ltiToolTemplate.privacy_permission,
		};
	} else {
		toolConfig = {
			config_type: 'basic',
			config_baseUrl: ltiToolTemplate.url,
		};
	}

	return {
		name: ltiToolTemplate.name,
		url: ltiToolTemplate.url,
		logoUrl: ltiToolTemplate.logo_url,
		parameters: mapToExternalToolParameter(ltiToolTemplate.customs, 'course', 'body'),
		isHidden: ltiToolTemplate.isHidden,
		openNewTab: ltiToolTemplate.openNewTab,
		version: 1,
		...toolConfig,
	};
}

function mapToSchoolExternalTool(externalTool, ltiToolTemplate, context) {
	return {
		tool: externalTool._id,
		school: context.schoolId,
		schoolParameters: mapToCustomParameterEntry(externalTool.parameters, ltiToolTemplate.customes),
		toolVersion: externalTool.version,
	};
}

function mapToContextExternalTool(schoolExternalTool, externalTool, context) {
	return {
		schoolTool: schoolExternalTool._id,
		contextId: context.id,
		contextType: 'course',
		contextToolName: externalTool.name,
		parameters: schoolExternalTool.parameters,
		toolVersion: schoolExternalTool.version,
	};
}

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb
module.exports = {
	up: async function up() {
		await connect();

		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not migrate lti tools to CTL for this instance.');
			return;
		}

		//
		//
		// FIND ALL LTI TOOL TEMPLATES
		const ltiToolTemplates = await LtiTool.find({
			// with name Bettermarks or Nextcloud
			// normally we don't need to check for name, if we want to migrate all ltitools
			$or: [{ name: { $regex: `Bettermarks` } }, { name: { $regex: `Nextcloud` } }],
			isTemplate: true,
		})
			.lean()
			.exec();

		if ((ltiToolTemplates || []).length === 0) {
			alert('No LtiTool Template found.');
			return;
		}

		const ltiTools = await LtiTool.find({
			$or: [{ name: { $regex: `Bettermarks` } }, { name: { $regex: `Nextcloud` } }],
			isTemplate: false,
		})
			.lean()
			.exec();

		// ITERATE OVER ALL LTITOOLS
		for (const ltiTool of ltiTools) {
			// GET TOOLTEMPLATE
			let toolTemplate = await LtiTool.findOne({
				id: ltiTool.originTool,
			})
				.lean()
				.exec();

			if (toolTemplate === undefined) {
				// toolTemplate = createTemplate(ltiTool);
			}

			// GET COURSE
			const course = await Course.findOne({
				ltiToolIds: { $in: [ltiTool.id] },
			})
				.lean()
				.exec();

			// GET EXTERNALTOOL
			let externalTool = await ExternalTool.findOne({
				name: ltiTool.name,
				url: ltiTool.url,
			})
				.lean()
				.exec();

			// CHECK IF EXTERNALTOOL EXISTS, IF NOT, CREATE ONE
			if (externalTool === undefined) {
				externalTool = mapToExternalTool(toolTemplate);
				externalTool = await ExternalTool.save(externalTool);
			}

			// GET/CREATE SCHOOLEXTERNALTOOL
			let schoolExternalTool;

			const schoolExternalTools = await SchoolExternalTool.find({
				tool: externalTool._id,
				school: course.schoolId,
				name: externalTool.name,
				url: externalTool.url,
			})
				.lean()
				.exec();

			if ((schoolExternalTools || []).length === 0) {
				schoolExternalTool = mapToSchoolExternalTool(externalTool, course);

				schoolExternalTool = await SchoolExternalTool.save(schoolExternalTool);
			} else {
				schoolExternalTool = schoolExternalTools.filter((tool) => tool.name === externalTool.name); // filter with more parameter?
			}

			// ----------- ContextExternalTool -----------

			const contextExternalTools = await ContextExternalTool.find({
				schoolTool: schoolExternalTool.id,
				contextId: context.Id,
				contextType: 'course',
			})
				.lean()
				.exec();

			if ((contextExternalTools || []).length === 0) {
				const contextExternalTool = mapToContextExternalTool(schoolExternalTool, course);

				await ContextExternalTool.save(contextExternalTool);
			}
		}

		await close();
	},

	down: async function down() {
		await connect();

		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not migrate lti tools to CTL for this instance.');
			return;
		}

		// FIND ALL LTI TOOL TEMPLATES
		const ltiToolTemplates = await LtiTool.find({
			// with name Bettermarks or Nextcloud
			// normally we don't need to check for name, if we want to migrate all ltitools
			$or: [{ name: { $regex: `Bettermarks` } }, { name: { $regex: `Nextcloud` } }],
			isTemplate: true,
		})
			.lean()
			.exec();

		// Get all names from ltiToolTemplates to find the corresponding externalTools
		const externalToolNames = ltiToolTemplates.map((ltitool) => {
			// check if ltitool is an oauthTool
			if (ltitool.oAuthClientId) {
				return ltitool.name;
			}
			return null;
		});

		if ((ltiToolTemplates || []).length === 0) {
			alert('No external tools found. Nothing to roll back.');
			return;
		}

		const externalTools = await ExternalTool.find({ name: { $in: externalToolNames } });

		alert(`Found ${externalTools.length} externaltool(s) to roll back.`);

		await ExternalTool.deleteMany(externalTools);

		await close();
	},
};
