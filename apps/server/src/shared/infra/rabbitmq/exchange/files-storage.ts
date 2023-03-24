import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityId } from '@shared/domain';

export const FilesStorageExchange = Configuration.get('FILES_STORAGE__EXCHANGE') as string;

export enum FilesStorageEvents {
	'COPY_FILES_OF_PARENT' = 'copy-files-of-parent',
	'LIST_FILES_OF_PARENT' = 'list-files-of-parent',
	'DELETE_FILES_OF_PARENT' = 'delete-files-of-parent',
}

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	ERROR = 'error',
}

export enum FileRecordParentType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Submission' = 'submissions',
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
	id?: EntityId;
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
	mimeType: string;
	parentType: FileRecordParentType;
	deletedSince?: Date;
}
