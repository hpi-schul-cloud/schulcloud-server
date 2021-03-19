/* eslint-disable max-classes-per-file */

import { Schema, Document as MongooseDocument } from 'mongoose';
import { error } from '../../logger';

// TODO find this in mongoose...
interface MongooseManyResult {
	/**
	 * 1 for success, 0 for error
	 */
	ok?: number;
	/**
	 * Number of elements matched the given filter
	 */
	n?: number;
}
interface MongooseUpdateManyResult extends MongooseManyResult {
	/**
	 * Number of elements updated
	 */
	nModified?: number;
}
interface MongooseDeleteManyResult extends MongooseManyResult {
	/**
	 * Number of elements deleted
	 */
	deletedCount?: number;
}

export interface UpdateManyResult {
	success: boolean;
	modifiedDocuments: number;
}

export interface DeleteManyResult {
	success: boolean;
	deletedDocuments: number;
}

/**
 * Base structure for mongoose documents with ObjectId as identifier.
 * We override id to only allow string as it's type.
 */
export abstract class BaseDocument extends MongooseDocument<Schema.Types.ObjectId> {
	id?: string;
}

/**
 * Some schemas are using timestamps:true, these can extend from this class.
 */
export abstract class BaseDocumentWithTimestamps extends BaseDocument {
	createdAt?: Date;

	updatedAt?: Date;
}

/**
 * Converts an mongoose update many result to an internal TO
 */
const updateManyResult = (mongooseResult: MongooseUpdateManyResult): UpdateManyResult => {
	const { ok, n, nModified } = mongooseResult;
	if (mongooseResult.ok !== 1) {
		error('mongoose updateMany has failed', { ok, n, nModified });
	}
	return { success: ok === 1, modifiedDocuments: nModified || 0 };
};

/**
 * Converts an mongoose delete many result to an internal TO
 */
const deleteManyResult = (mongooseResult: MongooseDeleteManyResult): DeleteManyResult => {
	const { ok, n, deletedCount } = mongooseResult;
	if (ok !== 1) {
		error('mongoose deleteMany has failed', { ok, n, deletedCount });
	}
	return { success: ok === 1, deletedDocuments: deletedCount || 0 };
};

export { updateManyResult, deleteManyResult };
