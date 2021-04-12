/* eslint-disable max-classes-per-file */

import mongoose, { Schema, LeanDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import idValidator from 'mongoose-id-validator';

import { ObjectId } from '../../../../../types';
import { BaseDocumentWithTimestamps } from '../../../helper/repo.helper';
import { enableAuditLog } from '../../../../utils/database';

// TODO add interfaces with referencing user/tool
class PseudonymDocument extends BaseDocumentWithTimestamps {
	userId?: ObjectId | any; // TODO UserDocument['_id'] | UserDocument;

	toolId?: ObjectId | any; // TODO LtiToolDocument['_id'] | LtiToolDocument;

	/** auto generated uuid v4 */
	pseudonym?: string;
}

const pseudonymSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user' },
		toolId: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
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

/** Pseudonym BO definition, to be used from anywhere */
export type Pseudonym = LeanDocument<PseudonymDocument>;

/** Pseudonym Mongoose Model for database access from within of the pseudonym repository only */
export const PseudonymModel = mongoose.model<PseudonymDocument>('Pseudonym', pseudonymSchema);
