const mongoose = require('mongoose');

const { Schema } = mongoose;

const { enableAuditLog } = require('../../utils/database');

const targetModels = ['courses', 'teams', 'class'];

const newsPermissions = {
	VIEW: 'NEWS_VIEW',
	EDIT: 'NEWS_EDIT',
	CREATE: 'NEWS_CREATE',
	REMOVE: 'NEWS_CREATE',
};

const newsSchema = new Schema({
	schoolId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'school',
	},
	title: { type: String, required: true },
	content: { type: String, required: true },
	displayAt: { type: Date, default: Date.now, required: true },

	creatorId: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
	createdAt: { type: Date, default: Date.now, required: true },

	updaterId: { type: Schema.Types.ObjectId, ref: 'user' },
	updatedAt: { type: Date },
	externalId: { type: String }, // e.g. guid for rss feed items
	source: {
		type: String,
		default: 'internal',
		enum: ['internal', 'rss'],
		required: true,
	},
	sourceDescription: {
		type: String,
	},
	target: {
		type: Schema.Types.ObjectId,
		// Instead of a hardcoded model name in `ref`, `refPath` means Mongoose
		// will look at the `targetModel` property to find the right model.
		refPath: 'targetModel',
		// target and targetModel must be defined together or not
		required: function requiredTarget() {
			return !!this.targetModel;
		},
	},
	targetModel: {
		type: String,
		enum: targetModels,
		// target and targetModel must be defined together or not
		required: function requiredTargetModel() {
			return !!this.target;
		},
	},
});

const newsHistorySchema = new Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	displayAt: { type: Date, default: Date.now },

	creatorId: { type: Schema.Types.ObjectId, ref: 'user' },
	createdAt: { type: Date, default: Date.now },
	parentId: { type: Schema.Types.ObjectId, ref: 'news' },
});

const newsModelName = 'news';
enableAuditLog(newsSchema, { modelName: newsModelName });
const newsModel = mongoose.model(newsModelName, newsSchema);

const newsHistoryModelName = 'newshistory';
enableAuditLog(newsHistorySchema, { modelName: newsHistoryModelName });
const newsHistoryModel = mongoose.model(newsHistoryModelName, newsHistorySchema);

module.exports = {
	newsModel,
	targetModels,
	newsHistoryModel,
	newsPermissions,
};
