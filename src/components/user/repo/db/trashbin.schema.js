const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'user',
			required: true,
			index: true,
		},
		user: { type: Object },
		account: { type: Object },
	},
	{
		timestamps: true,
	}
);

const model = mongoose.model('trashbin', schema);

module.exports = {
	model,
};
