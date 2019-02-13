const mongoose = require('mongoose');

const { Schema } = mongoose;

const newsModel = mongoose.model('news', new Schema({
	schoolId: { type: Schema.Types.ObjectId, required: true },
	title: { type: String, required: true },
	content: { type: String, required: true },
	displayAt: { type: Date, 'default': Date.now },

	creatorId: { type: Schema.Types.ObjectId, ref: 'user' },
	createdAt: { type: Date, 'default': Date.now },

	updaterId: { type: Schema.Types.ObjectId, ref: 'user' },
	updatedAt: { type: Date },
	history: [{ type: Schema.Types.ObjectId, ref: 'newsArchiv' }],
	externalId: { type: String }, // e.g. guid for rss feed items
	source: {
		type: String,
		default: 'internal',
		enum: ['internal', 'rss'],
	},
	sourceDescription: {
		type: String,
	},
	target: {
		type: Schema.Types.ObjectId,
		// Instead of a hardcoded model name in `ref`, `refPath` means Mongoose
		// will look at the `targetModel` property to find the right model.
		refPath: 'targetModel',
	},
	targetModel: {
		type: String,
		enum: ['courses', 'teams', 'class'],
	},
}));

const newsHistoryModel = mongoose.model('newshistory', new Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	displayAt: { type: Date, 'default': Date.now },

	creatorId: { type: Schema.Types.ObjectId, ref: 'user' },
	createdAt: { type: Date, 'default': Date.now },
	parentId: { type: Schema.Types.ObjectId, ref: 'news' },
}));


module.exports = {
	newsModel,
	newsHistoryModel,
};
