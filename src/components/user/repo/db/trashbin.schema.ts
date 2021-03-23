import mongoose, { LeanDocument } from 'mongoose';
import { ObjectId } from '../../../../../types';

import { BaseDocumentWithTimestamps } from '../../../helper/repo.helper';

const { Schema } = mongoose;

class TrashbinDocument extends BaseDocumentWithTimestamps {
	userId?: ObjectId | any;

	data?: [
		{
			scope: string;
			data: any;
		}
	];
}

const schema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'user',
			required: true,
			index: true,
		},
		createdAt: {
			type: Date,
			expires: 604800,
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

export type Trashbin = LeanDocument<TrashbinDocument>;
export const TrashbinModel = mongoose.model<TrashbinDocument>('trashbin', schema);
