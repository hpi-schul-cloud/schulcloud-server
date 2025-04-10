import { EntityData } from '@mikro-orm/core';
import { FileRecord } from '../../domain/';
import { FileRecordFactory } from '../../domain/file-record.factory';
import { FileRecordEntity } from '../file-record.entity';
import { FileRecordSecurityCheckEmbeddableMapper } from './file-record-security-check.embeddable.mapper';

export class FileRecordEntityMapper {
	public static mapToDo(entity: FileRecordEntity): FileRecord {
		const securityCheck = FileRecordSecurityCheckEmbeddableMapper.mapToDo(entity.securityCheck);

		const FileRecord = FileRecordFactory.buildFromFileRecordProps({
			id: entity.id,
			size: entity.size,
			name: entity.name,
			mimeType: entity.mimeType,
			parentType: entity.parentType,
			parentId: entity.parentId,
			creatorId: entity.creatorId,
			storageLocationId: entity.storageLocationId,
			storageLocation: entity.storageLocation,
			isUploading: entity.isUploading,
			securityCheck: securityCheck,
		});

		return FileRecord;
	}

	public static mapToDos(FileRecordEntities: FileRecordEntity[]): FileRecord[] {
		const FileRecords = FileRecordEntities.map((entity) => FileRecordEntityMapper.mapToDo(entity));

		return FileRecords;
	}

	public static mapToEntityProperties(domainObject: FileRecord): EntityData<FileRecordEntity> {
		const props = domainObject.getProps();
		const securityCheck = props.securityCheck
			? FileRecordSecurityCheckEmbeddableMapper.mapToEntity(props.securityCheck)
			: undefined;

		const fileRecordEntityProps = {
			name: props.name,
			size: props.size,
			mimeType: props.mimeType,
			parentType: props.parentType,
			parentId: props.parentId,
			creatorId: props.creatorId,
			storageLocationId: props.storageLocationId,
			storageLocation: props.storageLocation,
			isUploading: props.isUploading,
			securityCheck,
		};

		return fileRecordEntityProps;
	}
}
