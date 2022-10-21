const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const ExternalTool = mongoose.model(
	'externalToolUnique',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			url: { type: String, required: false },
			logoUrl: { type: String, required: false },
			config: {
				type: { type: String, required: true },
				baseUrl: { type: String, required: true },
			},
			parameters: [
				{
					name: { type: String, required: true },
					default: { type: String, required: true },
					scope: { type: String, required: false },
					location: { type: String, required: false },
					type: { type: String, required: false },
					regex: { type: String, required: false },
				},
			],
			isHidden: { type: Boolean, default: false },
			openNewTab: { type: Boolean, default: false },
			version: { type: Number, required: true },
		},
		{
			timestamps: true,
		}
	),
	'external_tools'
);

const SchoolExternalTool = mongoose.model(
	'schoolExternalToolUnique',
	new mongoose.Schema(
		{
			tool: { type: Schema.Types.ObjectId, ref: 'tool', required: true },
			school: { type: Schema.Types.ObjectId, ref: 'school', required: true },
			schoolParameters: [
				{
					name: { type: String, required: true },
					value: { type: String, required: false },
				},
			],
			toolVersion: { type: Number, required: true },
		},
		{
			timestamps: true,
		}
	),
	'school_external_tools'
);

const CourseExternalTool = mongoose.model(
	'courseExternalToolUnique',
	new mongoose.Schema(
		{
			schoolTool: { type: Schema.Types.ObjectId, ref: 'schooltool', required: true },
			course: { type: Schema.Types.ObjectId, ref: 'course', required: true },
			courseParameters: [
				{
					name: { type: String, required: true },
					value: { type: String, required: false },
				},
			],
			toolVersion: { type: Number, required: true },
		},
		{
			timestamps: true,
		}
	),
	'course_external_tools'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// - Only use models declared in the migration.
		// - Make sure your migration is idempotent. It is not guaranteed to run only once!
		// - Avoid any unnecessary references, including environment variables. If you have to run the migration on a single instance, use SC_THEME.
		await ExternalTool.createCollection();
		await SchoolExternalTool.createCollection();
		await CourseExternalTool.createCollection();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await CourseExternalTool.collection.drop();
		await SchoolExternalTool.collection.drop();
		await ExternalTool.collection.drop();
		// ////////////////////////////////////////////////////
		await close();
	},
};
