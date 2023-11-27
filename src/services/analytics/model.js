const mongoose = require('mongoose');

const { Schema } = mongoose;

const AnalyticsSchema = new Schema({
	createdAt: { type: Date, default: Date.now },

	firstPaint: { type: Number, default: 0 },
	timeToInteractive: { type: Number, default: 0 },
	pageLoaded: { type: Number, default: 0 },
	domInteractiveTime: { type: Number, default: 0 },
	domContentLoaded: { type: Number, default: 0 },

	requestStart: { type: Number, default: 0 },
	responseStart: { type: Number, default: 0 },
	responseEnd: { type: Number, default: 0 },

	downlink: { type: Number, default: 0 },
	connection: { type: String, required: false },
	path: { type: String, required: true },
	dl: { type: String, required: true },
	qt: { type: Number, default: 0 },
	cid: { type: String, required: true },

	swEnabled: { type: Boolean, default: false },
	swOffline: { type: Boolean, default: false },
	school: { type: String, required: false },
	networkProtocol: { type: String, required: false },
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
