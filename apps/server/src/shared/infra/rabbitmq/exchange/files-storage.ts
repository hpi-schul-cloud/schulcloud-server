import { EntityId } from '@shared/domain';

export enum FilesStorageExchanges {
	'FILES_STORAGE' = 'files-storage',
}

export enum FilesStorageEvents {
	'COPY_FILES_OF_PARENT' = 'COPY_FILES_OF_PARENT',
	'LIST_FILES_OF_PARENT' = 'LIST_FILES_OF_PARENT',
	'DELETE_FILES_OF_PARENT' = 'DELETE_FILES_OF_PARENT',
}

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
}

export enum FileRecordParentType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
}

export interface ICopyFilesOfParentParams {
	userId: EntityId;
	source: IFileRecordParams;
	target: IFileRecordParams;
}

export interface IFileRecordParams {
	schoolId: EntityId;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

export interface ICopyFileDO {
	id: EntityId;
	sourceId: EntityId;
	name: string;
}

export interface IFileDO {
	id: string;
	name: string;
	parentId: string;
	securityCheckStatus: ScanStatus;
	size: number;
	creatorId: string;
	type: string;
	parentType: FileRecordParentType;
	deletedSince?: Date;
}
