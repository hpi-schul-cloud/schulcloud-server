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
			roles: [
				{
					type: String,
					enum: ['Learner', 'Instructor', 'ContentDeveloper', 'Administrator', 'Mentor', 'TeachingAssistant'],
				},
			],
			privacy_permission: {
				type: String,
				enum: ['anonymous', 'e-mail', 'name', 'public', 'pseudonymous'],
				required: true,
				default: 'anonymous',
			},
			customs: [{ type: { key: { type: String }, value: { type: String } } }],
			isTemplate: { type: Boolean, required: true, default: false },
			isLocal: { type: Boolean },
			originTool: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
			oAuthClientId: { type: String },
			friendlyUrl: { type: String, unique: true },
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
			config_type: { type: String, required: true },
			config_baseUrl: { type: String, required: true },
			config_clientId: { type: String },
			config_skipConsent: { type: Boolean },
			config_key: { type: String },
			config_secret: { type: String },
			config_resource_link_id: { type: String },
			config_lti_message_type: {
				type: String,
				enum: ['basic-lti-launch-request', 'LtiResourceLinkRequest', 'LtiDeepLinkingRequest'],
			},
			config_privacy_permission: {
				type: String,
				enum: ['anonymous', 'e-mail', 'name', 'public', 'pseudonymous'],
				default: 'anonymous',
			},
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
							enum: ['string', 'number', 'boolean', 'auto_contextid', 'auto_contextname', 'auto_schoolid'],
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
			school: { type: Schema.Types.ObjectId, required: true },
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

const Course = mongoose.model(
	'course0906202311485',
	new mongoose.Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			school: { type: Schema.Types.ObjectId, required: true },
		},
		{
			timestamps: true,
		}
	),
	'courses'
);

function mapToExternalToolParameter(ltiToolTemplate) {
	return ltiToolTemplate.customs.map((parameter) => {
		return {
			name: parameter.key,
			displayName: parameter.key,
			description: '',
			default: '',
			regex: '',
			regexComment: '',
			scope: 'context',
			location: 'body',
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

function toolConfigMapper(ltiToolTemplate) {
	let toolConfig = {
		config_baseUrl: ltiToolTemplate.url,
		config_type: 'basic',
	};

	if (ltiToolTemplate.oAuthClientId) {
		toolConfig = {
			...toolConfig,
			config_type: 'oauth2',
			config_clientId: ltiToolTemplate.oAuthClientId,
			config_skipConsent: ltiToolTemplate.skipConsent,
		};
	} else if (ltiToolTemplate.key || ltiToolTemplate.key !== 'none') {
		toolConfig = {
			...toolConfig,
			config_type: 'lti11',
			config_key: ltiToolTemplate.key,
			config_secret: ltiToolTemplate.secret,
			config_ressource_link_id: ltiToolTemplate.ressource_link_id,
			config_lti_message_type: ltiToolTemplate.lti_message_type,
			config_privacy_permission: ltiToolTemplate.privacy_permission,
		};
	}

	return toolConfig;
}

function mapToExternalTool(ltiToolTemplate) {
	return {
		name: ltiToolTemplate.name,
		url: ltiToolTemplate.url,
		logoUrl: ltiToolTemplate.logo_url,
		parameters: mapToExternalToolParameter(ltiToolTemplate),
		isHidden: ltiToolTemplate.isHidden,
		openNewTab: ltiToolTemplate.openNewTab,
		version: 1,
		...toolConfigMapper(ltiToolTemplate),
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

		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			info('Migration does not migrate lti tools to CTL for this instance.');
			return;
		}

		// FIND ALL LTI TOOL TEMPLATES
		const ltiToolTemplates = await LtiTool.find({
			$or: [{ name: { $regex: `Bettermarks` } }, { name: { $regex: `Nextcloud` } }],
			isTemplate: true,
		})
			.lean()
			.exec();

		if ((ltiToolTemplates || []).length === 0) {
			alert('No LtiTool Template found.');
			return;
		}

		// FIND ALL LEGACY TOOLS
		const ltiTools = await LtiTool.find({
			$or: [{ name: { $regex: `Bettermarks` } }, { name: { $regex: `Nextcloud` } }],
			isTemplate: false,
		})
			.lean()
			.exec();

		/* eslint-disable no-await-in-loop */
		for (const ltiTool of ltiTools) {
			// GET TOOLTEMPLATE
			const toolTemplate = ltiToolTemplates.filter((template) => template._id === ltiTool.originTool);

			// GET COURSE
			const course = await Course.findOne({
				ltiToolIds: { $in: [ltiTool.id] },
			})
				.lean()
				.exec();

			if (course === undefined) {
				alert(`No course found with LtiToolId: ${ltiTool.id}.`);
				// eslint-disable-next-line no-continue
				continue;
			}

			// GET EXTERNALTOOL
			let externalTool = await ExternalTool.findOne({
				name: toolTemplate.name,
				url: toolTemplate.url, // or other paramter for the query
			})
				.lean()
				.exec();

			// CHECK IF EXTERNALTOOL EXISTS
			if (externalTool === undefined) {
				externalTool = mapToExternalTool(toolTemplate);
				externalTool = await ExternalTool.save(externalTool);
			}

			let schoolExternalTool;

			// GET SCHOOLEXTERNALTOOL
			const schoolExternalTools = await SchoolExternalTool.find({
				school: course.schoolId,
				tool: externalTool._id,
				name: externalTool.name,
				url: externalTool.url, // or other paramter for the query
			})
				.lean()
				.exec();

			// CHECK IF SCHOOLEXTERNALTOOL EXISTS
			if ((schoolExternalTools || []).length === 0) {
				schoolExternalTool = mapToSchoolExternalTool(externalTool, course);
				schoolExternalTool = await SchoolExternalTool.save(schoolExternalTool);
			} else {
				schoolExternalTool = schoolExternalTools.filter((tool) => tool.name === externalTool.name); // filter with more parameter?
			}

			// GET CONTEXTEXTERNALTOOL
			const contextExternalTools = await ContextExternalTool.find({
				schoolTool: schoolExternalTool.id,
				contextId: course.Id,
				contextType: 'course',
			})
				.lean()
				.exec();

			// CHECK IF CONTEXTEXTERNALTOOL EXISTS
			if ((contextExternalTools || []).length === 0) {
				const contextExternalTool = mapToContextExternalTool(schoolExternalTool, course);

				await ContextExternalTool.save(contextExternalTool);
			}
		}

		await close();
	},

	down: async function down() {
		await connect();

		await close();
	},
};
