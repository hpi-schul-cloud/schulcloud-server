import mongoose, { Schema, Document, LeanDocument } from 'mongoose';
import type { ObjectId } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import idValidator from 'mongoose-id-validator';

import { enableAuditLog } from '../../utils/database';

// TODO add interfaces with referencing user/tool
interface PseudonymDocument extends Document {
	userId?: ObjectId; // TODO IUserDocument['_id'];
	toolId?: ObjectId; // TODO IToolDocument['_id'];
	pseudonym?: string;
}

export type PseudonymModel = LeanDocument<PseudonymDocument>;

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

export default mongoose.model('Pseudonym', pseudonymSchema);
