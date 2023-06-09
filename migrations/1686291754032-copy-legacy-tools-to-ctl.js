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
			name: { type: String },
			url: { type: String, required: true },
			key: { type: String },
			secret: { type: String, required: true },
			logo_url: { type: String },
			lti_message_type: { type: String },
			lti_version: { type: String },
			resource_link_id: { type: String },
			roles: {
				type: [
					{
						type: String,
						enum: ['Learner', 'Instructor', 'ContentDeveloper', 'Administrator', 'Mentor', 'TeachingAssistant'],
					},
				],
			},
			privacy_permission: {
				type: String,
				enum: ['anonymous', 'e-mail', 'name', 'public', 'pseudonymous'],
				default: 'anonymous',
			},
			customs: { type: [{ key: { type: String }, value: { type: String } }] },
			isTemplate: { type: Boolean },
			isLocal: { type: Boolean },
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
			originTool: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
			oAuthClientId: { type: String },
			friendlyUrl: { type: String, unique: true, sparse: true },
			skipConsent: { type: Boolean },
			openNewTab: { type: Boolean, default: false },
			frontchannel_logout_uri: { type: String },
			isHidden: { type: Boolean, default: false },
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
			name: { type: String },
			url: { type: String },
			logoUrl: { type: String },
			config_type: { type: String },
			config_baseUrl: { type: String },
			config_clientId: { type: String },
			config_skipConsent: { type: Boolean },
			parameters: { type: [{ key: { type: String }, value: { type: String } }] },
			isHidden: { type: Boolean },
			openNewTab: { type: Boolean },
			createdAt: { type: Date, default: Date.now },
			$date: { type: Date },
			updatedAt: { type: Date, default: Date.now },
			version: { type: Number },
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
			tool: { type: Schema.Types.ObjectId, ref: 'externalTool', required: true },
			school: { type: Schema.Types.ObjectId, ref: 'school', required: true },
			schoolParameters: { type: [{ key: { type: String }, value: { type: String } }] },
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
			toolVersion: { type: Number },
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
			schoolTool: { type: Schema.Types.ObjectId, ref: 'schoolTool', required: true },
			contextId: { type: Schema.Types.ObjectId, ref: 'context', required: true },
			contextType: { type: [{ key: { type: String }, value: { type: String } }] },
			contextToolName: { type: String },
			parameters: { type: [{ key: { type: String }, value: { type: String } }] },
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
			toolVersion: { type: Number },
		},
		{
			timestamps: true,
		}
	),
	'context_external_tools'
);

function mapToExternalToolWithOauthConfig(ltiTool) {
	return {
		name: ltiTool.name,
		url: ltiTool.url,
		logoUrl: ltiTool.logo_url,
		config_type: 'oauth2',
		config_baseUrl: ltiTool.url,
		config_clientId: ltiTool.oAuthClientId,
		config_skipConsent: ltiTool.skipConsent,
		parameters: mapToExternalToolParameter(ltiTool.customs, 'global', 'query'), //
		isHidden: ltiTool.isHidden,
		openNewTab: ltiTool.openNewTab,
		createdAt: ltiTool.createdAt,
		$date: ltiTool.createdAt,
		updatedAt: ltiTool.updatedAt,
		version: 1,
	};
}

function mapToSchoolExternalTool(externalTool) {
	return {
		tool: externalTool._id,
		school: externalTool.school,
		schoolParameters: externalTool.parameters,
		createdAt: externalTool.createdAt,
		updatedAt: externalTool.updatedAt,
		toolVersion: externalTool.version,
	};
}

function mapToContextExternalTool(schoolTool, context) {
	return {
		schoolTool: schoolTool._id,
		contextId: context.id,
		contextType: context.type,
		contextToolName: context.name,
		parameters: schoolTool.parameters,
		createdAt: schoolTool.createdAt,
		updatedAt: schoolTool.updatedAt,
		toolVersion: schoolTool.version,
	};
}

// no documantation about parameter mapping of ltitool customs to external tool parameters https://docs.dbildungscloud.de/display/N21P/Migration+from+LTI+to+CTL
function mapToExternalToolParameter(ltiTool, scope, location) {
	return ltiTool.customs.map((parameter) => {
		return {
			name: ltiTool.key,
			displayName: ltiTool.key,
			description: ltiTool.key,
			default: ltiTool.value,
			regex: '',
			regexDescription: '',
			scope,
			location,
			type: 'string',
			createdAt: ltiTool.createdAt,
			updatedAt: ltiTool.updatedAt,
		};
	});
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
			alert('No LtiTool Template found. Nothing to migrate.');
			return;
		}

		alert(`Found ${ltiToolTemplates.length} LtiToolTemplate for update.`);

		//
		//
		// MAP TO EXTERNAL TOOL WITH OAUTH CONFIG
		const externalTools = ltiToolTemplates.map((ltitool) => {
			// Find oauthTools
			if (ltitool.oAuthClientId) {
				return mapToExternalToolWithOauthConfig(ltitool);
			}

			alert(`LtiToolTemplate ${ltitool.name} has no oAuthClientId. Nothing to migrate.`);
			return null;
		});

		alert(externalTools);

		//
		//
		// SAVE EXTERNAL TOOLS
		await ExternalTool.insertMany(externalTools);

		// FOR SCHOOLEXTERNALTOOL CREATION WE NEED TO FIND THE SCHOOLS, ExternalTool AND LtiTool with originalId
		const schoolExternalTools = externalTools.map((externalTool) => {
			if (externalTool) {
				return mapToSchoolExternalTool(externalTool);
			}
			return null;
		});

		alert(`Created ${externalTools.length} ExternalTool(s)`);

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
