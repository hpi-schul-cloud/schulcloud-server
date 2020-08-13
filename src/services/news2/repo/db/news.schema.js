const mongoose = require('mongoose');

const { Schema } = mongoose;
const targetModels = require('../../../scope/repo/targetModels');

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

const newsModel = mongoose.model('news', newsSchema);
const newsHistoryModel = mongoose.model('newshistory', newsHistorySchema);

module.exports = {
	newsModel,
	newsHistoryModel,
	newsPermissions,
};
