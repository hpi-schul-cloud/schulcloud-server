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
	},
	{
		timestamps: true,
	}
);

const trashbinModel = mongoose.model('trashbin', schema);

module.exports = trashbinModel;
