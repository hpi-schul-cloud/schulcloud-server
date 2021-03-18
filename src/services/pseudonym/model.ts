/* eslint-disable max-classes-per-file */

import mongoose, { Schema, LeanDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import idValidator from 'mongoose-id-validator';

import { ObjectId } from '../../../types';
import { DocumentWithTimestamps } from '../../components/helper/repo.helper';
import { enableAuditLog } from '../../utils/database';

// interface WithId {
// 	_id?: Schema.Types.ObjectId;
// 	id?: string;
// }

// TODO add interfaces with referencing user/tool
class PseudonymDocument extends DocumentWithTimestamps {
	userId?: ObjectId; // TODO IUserDocument['_id'];

	toolId?: ObjectId; // TODO IToolDocument['_id'];

	/** auto generated uuid v4 */
	pseudonym?: string;
}

const pseudonymSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user' }, // TODO can we add required here?
		toolId: { type: Schema.Types.ObjectId, ref: 'ltiTool' }, // TODO can we add required here?
		pseudonym: {
			type: String,
			required: true,
			unique: true,
			default: uuidv4,
		},
	},
	{
		timestamps: true,
	}
);

pseudonymSchema.index({ pseudonym: 1 }, { unique: true });
pseudonymSchema.index({ userId: 1, toolId: 1 }, { unique: true });

pseudonymSchema.plugin(idValidator);
enableAuditLog(pseudonymSchema);

export type Pseudonym = LeanDocument<PseudonymDocument>;
export default mongoose.model<PseudonymDocument>('Pseudonym', pseudonymSchema);
