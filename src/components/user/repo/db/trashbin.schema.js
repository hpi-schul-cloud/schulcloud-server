const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'user',
			required: true,
			index: true,
		},
		data: [
			{
				scope: { type: String },
				data: { type: Object },
			},
		],
		skipDeletion: { type: Boolean, default: false},
	},
	{
		timestamps: true,
	}
);

const trashbinModel = mongoose.model('trashbin', schema);

module.exports = trashbinModel;
