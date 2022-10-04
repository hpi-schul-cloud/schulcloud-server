import { EntityId, FileRecordParentType, ScanStatus } from '@shared/domain';

export enum FilesStorageExchanges {
	'FILES_STORAGE' = 'files-storage',
}

export enum FilesStorageEvents {
	'COPY_FILES_OF_PARENT' = 'COPY_FILES_OF_PARENT',
	'LIST_FILES_OF_PARENT' = 'LIST_FILES_OF_PARENT',
	'DELETE_FILES_OF_PARENT' = 'DELETE_FILES_OF_PARENT',
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
