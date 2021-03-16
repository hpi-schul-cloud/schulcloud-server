import mongoose, { Schema, Document } from 'mongoose';
import type { ObjectId } from 'mongoose';
import v4 from 'uuid';
import idValidator from 'mongoose-id-validator';

import { enableAuditLog } from '../../utils/database';

// TODO interfaces, need to be moved somewhere else

export interface IWithTimestamps {
	createdAt: Date;
	updatedAt: Date;
}

export interface IPseudonymBaseDocument extends IWithTimestamps, Document {
	pseudonym?: string; // TODO make required (as defined in the schema, but fails in createTestPseudonym currently)
}

// TODO add interfaces with referencing user/tool
export interface IPseudonymDocument extends IPseudonymBaseDocument {
	userId?: ObjectId; // TODO IUserDocument['_id'];
	toolId?: ObjectId; // TODO IToolDocument['_id'];
}

const pseudonymSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user' }, // TODO can we add required here?
		toolId: { type: Schema.Types.ObjectId, ref: 'ltiTool' }, // TODO can we add required here?
		pseudonym: {
			type: String,
			required: true,
			unique: true,
			default: v4,
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

export default mongoose.model<IPseudonymDocument>('Pseudonym', pseudonymSchema);
