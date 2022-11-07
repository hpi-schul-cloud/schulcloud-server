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
}

export enum FileRecordParent {
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
	parentType: FileRecordParent;
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
	parentType: FileRecordParent;
	deletedSince?: Date;
}
