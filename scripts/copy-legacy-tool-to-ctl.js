/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { program } = require('commander');
const { v4: uuidv4 } = require('uuid');

program.requiredOption('-u, --url <value>', '(Required) URL of the MongoDB instance');
program.parse();

const options = program.opts();
const mongodbUrl = options.url;

const close = async () => mongoose.connection.close();

const connect = async () => {
	const mongooseOptions = {
		useNewUrlParser: true,
		useFindAndModify: false,
		useCreateIndex: true,
		useUnifiedTopology: true,
	};

	return mongoose.connect(mongodbUrl, mongooseOptions);
};

const customParameterEntrySchema = new Schema(
	{
		name: String,
		value: String,
	},
	{ _id: false }
);

const LtiTool = mongoose.model(
	'ltiTool0906202311481',
	new Schema(
		{
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
			originTool: { type: Schema.Types.ObjectId, ref: 'ltiTool0906202311481' },
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
	new Schema(
		{
			name: { type: String, unique: true },
			url: String,
			logoUrl: String,
			config_type: String,
			config_baseUrl: String,
			config_clientId: String,
			config_skipConsent: Boolean,
			config_key: String,
			config_secret: String,
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
	new Schema(
		{
			tool: { type: Schema.Types.ObjectId, ref: 'external_tool0906202311482' },
			school: { type: Schema.Types.ObjectId },
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
	new Schema(
		{
			schoolTool: { type: Schema.Types.ObjectId, ref: 'school_external_tool0906202311483' },
			contextId: String,
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
			school: Schema.Types.ObjectId,
			ltiToolIds: [{ type: Schema.Types.ObjectId, ref: 'ltiTool0906202311481' }],
		},
		{
			timestamps: true,
		}
	),
	'courses'
);

const Pseudonym = mongoose.model(
	'pseudonym0906202311486',
	new Schema(
		{
			userId: { type: Schema.Types.ObjectId },
			toolId: { type: Schema.Types.ObjectId, ref: 'ltiTool0906202311481' },
			pseudonym: {
				type: String,
				required: true,
				unique: true,
				default: uuidv4,
			},
		},
		{
			timestamps: true,
		}
	),
	'pseudonyms'
);

const Pseudonym2 = mongoose.model(
	'external-tool-pseudonyms0906202311486',
	new Schema(
		{
			userId: { type: Schema.Types.ObjectId },
			toolId: { type: Schema.Types.ObjectId, ref: 'external_tool0906202311482' },
			pseudonym: {
				type: String,
				required: true,
				unique: true,
				default: uuidv4,
			},
		},
		{
			timestamps: true,
		}
	),
	'external-tool-pseudonyms'
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
	} else if (ltiToolTemplate.key && ltiToolTemplate.key !== 'none') {
		toolConfig = {
			...toolConfig,
			config_type: 'lti11',
			config_key: ltiToolTemplate.key,
			config_secret: ltiToolTemplate.secret,
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
		school: course.schoolId,
		schoolParameters: [],
		toolVersion: externalTool.version,
	};
}

function mapToContextExternalTool(schoolExternalTool, course) {
	return {
		schoolTool: schoolExternalTool._id,
		contextId: course._id,
		contextType: 'course',
		parameters: [],
		toolVersion: schoolExternalTool.toolVersion,
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
	const pseudonymsLegacyTools = await Pseudonym.find({
		toolId: toolTemplate._id,
	})
		.lean()
		.exec();

	const newPseudonyms = [];
	for (const legacyPseudonym of pseudonymsLegacyTools) {
		const existingPseudonym = await Pseudonym2.findOne({
			pseudonym: legacyPseudonym.pseudonym,
		})
			.lean()
			.exec();

		if (!existingPseudonym) {
			newPseudonyms.push({
				userId: legacyPseudonym.userId,
				toolId: externalTool._id,
				pseudonym: legacyPseudonym.pseudonym,
			});
		}
	}
	await Pseudonym2.insertMany(newPseudonyms);
}

async function createExternalTool(toolTemplate) {
	let externalTool = await ExternalTool.findOne({
		name: { $regex: `${toolTemplate.name}` },
	})
		.lean()
		.exec();

	if (!externalTool) {
		externalTool = mapToExternalTool(toolTemplate);
		externalTool = (await ExternalTool.insertMany(externalTool))[0];
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
	if (!schoolExternalTool) {
		schoolExternalTool = mapToSchoolExternalTool(externalTool, course);
		schoolExternalTool = (await SchoolExternalTool.insertMany(schoolExternalTool))[0];
	}

	return schoolExternalTool;
}

async function createContextExternalTool(schoolExternalTool, course) {
	const contextExternalTools = await ContextExternalTool.find({
		schoolTool: schoolExternalTool._id,
		contextId: course._id,
		contextType: 'course',
	})
		.lean()
		.exec();

	// CHECK IF CONTEXTEXTERNALTOOL EXISTS
	if ((contextExternalTools || []).length === 0) {
		const contextExternalTool = mapToContextExternalTool(schoolExternalTool, course);
		await ContextExternalTool.insertMany(contextExternalTool);
	}
}

const up = async () => {
	await connect();

	// FIND ALL LTI TOOL TEMPLATES
	const ltiToolTemplates = await LtiTool.find({
		$or: [{ name: { $regex: /Bettermarks/i } }, { name: { $regex: /Nextcloud/i } }],
		isTemplate: true,
	})
		.lean()
		.exec();

	if ((ltiToolTemplates || []).length === 0) {
		return Promise.reject(new Error('No LtiTool Template found.'));
	}

	const ltiToolExternalToolIdTupelList = [];

	// FIND EXTERNAL TOOLS
	const externalTools = await Promise.all(
		ltiToolTemplates.map(async (toolTemplate) => {
			const externalTool = await createExternalTool(toolTemplate);
			ltiToolExternalToolIdTupelList.push({
				templateId: toolTemplate._id,
				externalToolId: externalTool._id,
			});

			return externalTool;
		})
	);

	// FIND ALL LEGACY TOOLS
	const ltiTools = await LtiTool.find({
		$or: [{ name: { $regex: /Bettermarks/i } }, { name: { $regex: /Nextcloud/i } }],
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

		if (!course) {
			console.info(`No course found with LtiToolId: ${ltiTool._id}.`);
			// eslint-disable-next-line no-continue
			continue;
		}

		// GET EXTERNALTOOL
		const ltiToolExternalToolIdTupel = ltiToolExternalToolIdTupelList.find(
			(idTupel) => idTupel.templateId.toString() === ltiTool.originTool.toString()
		);
		const externalTool = externalTools.find((tool) => tool._id === ltiToolExternalToolIdTupel.externalToolId);

		// GET SCHOOLEXTERNALTOOL
		const schoolExternalTool = await createSchoolExternalTool(externalTool, course);

		// CREATE CONTEXTEXTERNALTOOL
		await createContextExternalTool(schoolExternalTool, course);
	}

	await close();
	return Promise.resolve();
};

(async () => {
	try {
		await up();
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
})();
