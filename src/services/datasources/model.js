const mongoose = require('mongoose');

const { Schema } = mongoose;

const dataSourceSchema = new Schema(
	{
		name: { type: String, required: true },
		config: { type: Object, required: true },
		protected: [{ type: String }],
		schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
		createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
		updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
		lastRun: { type: Date },
		lastStatus: { type: String, enum: ['Success', 'Pending', 'Error'] },
	},
	{ timestamps: true }
);

const datasourceModel = mongoose.model('datasource', dataSourceSchema);

const dataSourceRunSchema = new Schema(
	{
		datasourceId: { type: Schema.Types.ObjectId, ref: 'datasource', required: true },
		createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
		duration: { type: Number },
		status: { type: String, enum: ['Success', 'Pending', 'Error'] },
		dryrun: { type: Boolean, default: false },
		log: { type: String },
		config: { type: Object },
		schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
	},
	{ timestamps: true }
);

const datasourceRunModel = mongoose.model('datasourceRun', dataSourceRunSchema);

module.exports = { datasourceModel, datasourceRunModel };
