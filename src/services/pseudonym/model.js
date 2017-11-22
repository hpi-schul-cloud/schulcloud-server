const mongoose = require("mongoose"),
	uuid	   = require("uuid/v4"),
	Schema	   = mongoose.Schema;

//const conn = mongoose.createConnection("mongodb://localhost:27017/schulcloud");

const Pseudonym = new Schema({
	userId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
	toolId: {type: Schema.Types.ObjectId, required: true, ref: 'ltiTool'},
	token : {type: String, required: true, default: uuid},
}, {
	timestamps: true
});

module.exports = mongoose.model("Pseudonym", Pseudonym);
