const mongoose = require('mongoose');

const { Schema } = mongoose;

const dataSourceSchema = new Schema({
	name: { type: String, required: true },
	config: { type: Object, required: true },
	schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
	createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
	updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
	lastRun: { type: Date },
	lastStatus: { type: String, enum: ['Success', 'Warning', 'Error'] },
}, { timestamps: true });

const datasourceModel = mongoose.model('datasource', dataSourceSchema);

const dataSourceRunSchema = new Schema({
	datasource: { type: Schema.Types.ObjectId, ref: 'datasource', required: true },
	createdBy: { type: Schema.Types.ObjectId, ref: 'user', required: true },
	duration: { type: Number },
	status: { type: String, enum: ['Success', 'Warning', 'Error'] },
	dryrun: { type: Boolean },
	log: { type: String },
	config: { type: Object },
}, { timestamps: true });


const datasourceRunModel = mongoose.model('datasourceRun', dataSourceRunSchema);

module.exports = { datasourceModel, datasourceRunModel };
