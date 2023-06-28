/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error, info } = require('../src/logger');

const { Schema } = mongoose;

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

const customParameterEntrySchema = new Schema(
	{
		name: String,
		value: String,
	},
	{ _id: false }
);

const LtiTool = mongoose.model(
	'ltitool0906202311481',
	new mongoose.Schema(
		{
			_id: Schema.Types.ObjectId,
			name: String,
			url: String,
			key: String,
			secret: String,
			logo_url: String,
			lti_message_type: String,
			lti_version: String,
			resource_link_id: String,
			roles: [
				{
					type: String,
					enum: ['Learner', 'Instructor', 'ContentDeveloper', 'Administrator', 'Mentor', 'TeachingAssistant'],
				},
			],
			privacy_permission: {
				type: String,
				enum: ['anonymous', 'e-mail', 'name', 'public', 'pseudonymous'],
			},
			customs: [{ type: { key: { type: String }, value: { type: String } } }],
			isTemplate: Boolean,
			isLocal: Boolean,
			originTool: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
			oAuthClientId: String,
			friendlyUrl: { type: String, unique: true },
			skipConsent: Boolean,
			openNewTab: Boolean,
			frontchannel_logout_uri: String,
			isHidden: Boolean,
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
			_id: Schema.Types.ObjectId,
			name: { type: String, unique: true },
			url: String,
			logoUrl: String,
			config_type: String,
			config_baseUrl: String,
			config_clientId: String,
			config_skipConsent: Boolean,
			config_key: String,
			config_secret: String,
			config_resource_link_id: String,
			config_lti_message_type: {
				type: String,
				enum: ['basic-lti-launch-request', 'LtiResourceLinkRequest', 'LtiDeepLinkingRequest'],
			},
			config_privacy_permission: {
				type: String,
				enum: ['anonymous', 'e-mail', 'name', 'public', 'pseudonymous'],
			},
			parameters: [
				{
					type: {
						name: String,
						displayName: String,
						description: String,
						default: String,
						regex: String,
						regexComment: String,
						scope: {
							type: String,
							enum: ['global', 'school', 'context'],
						},
						location: {
							type: String,
							enum: ['path', 'body', 'query'],
						},
						type: {
							type: String,
							enum: ['string', 'number', 'boolean', 'auto_contextid', 'auto_contextname', 'auto_schoolid'],
						},
						isOptional: Boolean,
					},
				},
			],

			isHidden: Boolean,
			openNewTab: Boolean,
			version: Number,
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
			_id: Schema.Types.ObjectId,
			tool: { type: Schema.Types.ObjectId, ref: 'externalTool' },
			school: Schema.Types.ObjectId,
			schoolParameters: [customParameterEntrySchema],
			toolVersion: Number,
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
			_id: Schema.Types.ObjectId,
			schoolTool: { type: Schema.Types.ObjectId, ref: 'schoolExternalTool' },
			contextId: Schema.Types.ObjectId,
			contextType: { type: String, enum: ['course'] },
			displayName: String,
			parameters: [customParameterEntrySchema],
			toolVersion: Number,
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
			_id: Schema.Types.ObjectId,
			school: Schema.Types.ObjectId,
			ltiToolIds: [{ type: Schema.Types.ObjectId, ref: 'ltiTool' }],
		},
		{
			timestamps: true,
		}
	),
	'courses'
);

const Pseudonym = mongoose.model(
	'pseudonym0906202311486',
	new mongoose.Schema(
		{
			_id: Schema.Types.ObjectId,
			pseudonym: String,
			toolId: Schema.Types.ObjectId,
			userId: Schema.Types.ObjectId,
		},
		{
			timestamps: true,
		}
	),
	'pseudonyms'
);

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
			config_privacy_permission: ltiToolTemplate.privacy_permission || 'anonymous',
		};
	}

	return toolConfig;
}

function mapToExternalTool(ltiToolTemplate) {
	return {
		name: ltiToolTemplate.name,
		url: ltiToolTemplate.url,
		logoUrl: ltiToolTemplate.logo_url,
		parameters: [],
		isHidden: ltiToolTemplate.isHidden,
		openNewTab: ltiToolTemplate.openNewTab,
		version: 1,
		...toolConfigMapper(ltiToolTemplate),
	};
}

function mapToSchoolExternalTool(externalTool, course) {
	return {
		tool: externalTool._id,
		school: course.school,
		schoolParameters: [],
		toolVersion: externalTool.version,
	};
}

function mapToContextExternalTool(schoolExternalTool, course) {
	return {
		schoolTool: schoolExternalTool._id,
		contextId: course.id,
		contextType: 'course',
		parameters: [],
		toolVersion: schoolExternalTool.version,
	};
}

function mapPseudonyms(pseudonym, externalTool) {
	return {
		pseudonym: pseudonym.pseudonym,
		toolId: externalTool._id,
		userId: pseudonym.userId,
	};
}

async function createPseudonyms(toolTemplate, externalTool) {
	const pseudonymsLegacyTools = Pseudonym.find({
		toolId: toolTemplate._id,
	})
		.lean()
		.exec();

	const pseudonymsCTLTools = Pseudonym.find({
		toolId: externalTool._id,
	})
		.lean()
		.exec();

	// FILTER EXISTING PSEUDONYM
	let missingPseudonyms = pseudonymsLegacyTools.filter(
		(pseudonymsLegacyTool) =>
			!pseudonymsCTLTools.some((pseudonymsCTLTool) => pseudonymsCTLTool.userId === pseudonymsLegacyTool.userId)
	);

	missingPseudonyms = missingPseudonyms.map((pseudonym) => mapPseudonyms(pseudonym, externalTool));

	await Pseudonym.insertMany(missingPseudonyms).exec();
}

async function createExternalTool(toolTemplate) {
	let externalTool = await ExternalTool.findOne({
		name: { $regex: `${toolTemplate.name}` },
	})
		.lean()
		.exec();

	if (externalTool === undefined) {
		externalTool = mapToExternalTool(externalTool);
		externalTool = await ExternalTool.save(externalTool).exec();
	}

	createPseudonyms(toolTemplate, externalTool);

	return externalTool;
}

async function createSchoolExternalTool(externalTool, course) {
	let schoolExternalTool = await SchoolExternalTool.findOne({
		school: course.schoolId,
		tool: externalTool._id,
	})
		.lean()
		.exec();

	// CHECK IF SCHOOLEXTERNALTOOL EXISTS
	if (schoolExternalTool === undefined) {
		schoolExternalTool = mapToSchoolExternalTool(externalTool, course);
		schoolExternalTool = await SchoolExternalTool.save(schoolExternalTool).exec();
	}

	return schoolExternalTool;
}

async function createContextExternalTool(schoolExternalTool, course) {
	const contextExternalTools = await ContextExternalTool.find({
		schoolTool: schoolExternalTool._id,
		contextId: course.id,
		contextType: 'course',
	})
		.lean()
		.exec();

	// CHECK IF CONTEXTEXTERNALTOOL EXISTS
	if ((contextExternalTools || []).length === 0) {
		const contextExternalTool = mapToContextExternalTool(schoolExternalTool, course);
		await ContextExternalTool.save(contextExternalTool).exec();
	}
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

		// FIND EXTERNAL TOOLS
		const externalTools = ltiToolTemplates.map((toolTemplate) => createExternalTool(toolTemplate));

		// FIND ALL LEGACY TOOLS
		const ltiTools = await LtiTool.find({
			$or: [{ name: { $regex: `Bettermarks` } }, { name: { $regex: `Nextcloud` } }],
			isTemplate: false,
		})
			.lean()
			.exec();

		for (const ltiTool of ltiTools) {
			// GET COURSE
			const course = await Course.findOne({
				ltiToolIds: { $in: [ltiTool._id] },
			})
				.lean()
				.exec();

			if (course === undefined) {
				alert(`No course found with LtiToolId: ${ltiTool.id}.`);
				// eslint-disable-next-line no-continue
				continue;
			}

			// GET EXTERNALTOOL
			const externalTool = externalTools.find((tool) => tool.name === ltiTool.name);

			// GET SCHOOLEXTERNALTOOL
			const schoolExternalTool = createSchoolExternalTool(externalTool, course);

			// CREATE CONTEXTEXTERNALTOOL
			createContextExternalTool(schoolExternalTool, course);
		}

		await close();
	},

	down: async function down() {
		await connect();

		await close();
	},
};
