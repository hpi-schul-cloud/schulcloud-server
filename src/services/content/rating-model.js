const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
	materialId: {type: mongoose.Schema.ObjectId, required: true }, //TODO ref?
	userId: {type: mongoose.Schema.ObjectId, ref: 'user', required: true },
	topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'topic', required: true },
	courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
	createdAt: { type: Date, default: Date.now },
	state: { type: String, default: 'pending', enum: ['pending', 'declined', 'done'] },
	readAt: Date
});

const ratingModel = mongoose.model('rating', ratingSchema);

module.exports = ratingModel;
