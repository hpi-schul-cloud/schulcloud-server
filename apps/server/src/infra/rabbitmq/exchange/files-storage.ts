import { EntityId } from '@shared/domain/types';

export enum FilesStorageEvents {
	'COPY_FILES_OF_PARENT' = 'copy-files-of-parent',
	'LIST_FILES_OF_PARENT' = 'list-files-of-parent',
	'DELETE_FILES_OF_PARENT' = 'delete-files-of-parent',
	'REMOVE_CREATORID_OF_FILES' = 'remove-creatorId-of-files',
	'DELETE_FILES' = 'delete-files',
}

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	WONT_CHECK = 'wont_check',
	ERROR = 'error',
}

export enum FileRecordParentType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Submission' = 'submissions',
	'Grading' = 'gradings',
	'BoardNode' = 'boardnodes',
}

export interface CopyFilesOfParentParams {
	userId: EntityId;
	source: FileRecordParams;
	target: FileRecordParams;
}

export interface FileRecordParams {
	schoolId: EntityId;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

export interface CopyFileDO {
	id?: EntityId;
	sourceId: EntityId;
	name: string;
}

export interface FileDO {
	id: string;
	name: string;
	parentId: string;
	securityCheckStatus: ScanStatus;
	size: number;
	creatorId?: string;
	mimeType: string;
	parentType: FileRecordParentType;
	deletedSince?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}
