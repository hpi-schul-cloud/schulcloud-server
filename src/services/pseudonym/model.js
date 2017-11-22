const mongoose = require("mongoose"),
	uuid	   = require("uuid/v4"),
	Schema	   = mongoose.Schema;

//const conn = mongoose.createConnection("mongodb://localhost:27017/schulcloud");

const Pseudonym = new Schema({
<<<<<<< 608e07b6831ba68a37c978bf8343ff6c9b8ff40f
	userId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
	toolId: {type: Schema.Types.ObjectId, required: true, ref: 'ltiTool'},
=======
	userId: {type: Schema.Types.ObjectId, required: true},
	toolId: {type: Schema.Types.ObjectId, required: true},
>>>>>>> pseudoservice basis
	token : {type: String, required: true, default: uuid},
}, {
	timestamps: true
});

module.exports = mongoose.model("Pseudonym", Pseudonym);
