const mongoose = require("mongoose"),
	uuid	   = require("uuid/v4"),
	Schema	   = mongoose.Schema;

const Pseudonym = new Schema({
	userId: {type: Schema.Types.ObjectId, ref: 'user'},
	toolId: {type: Schema.Types.ObjectId, ref: 'ltiTool'},
	token : {type: String, required: true, default: uuid},
}, {
	timestamps: true
});

module.exports = mongoose.model("Pseudonym", Pseudonym);
