import { InternalServerErrorException } from '@nestjs/common';
import { BaseDOProps } from '@shared/domain';
import { FileRecord, fileRecordFactory, FileRecordParams } from '../domain';
import { FileRecordEntity } from './filerecord.entity';

// TODO: change naming Entity to Datarecord, or without entity
// TODO: Add interface / Base class that all mappers include the same structure? Naming when no entity is avaible?
// TODO: include factory methods..
export class FileRecordDOMapper {
	static entityToDO(fileRecordEntity: FileRecordEntity): FileRecord {
		const props: FileRecordParams & BaseDOProps = {
			id: fileRecordEntity.id,
			size: fileRecordEntity.size,
			name: fileRecordEntity.name,
			mimeType: fileRecordEntity.mimeType,
			parentType: FileRecordEntity.parentType,
			parentId: fileRecordEntity.parentId,
			schoolId: fileRecordEntity.schoolId,
			creatorId: fileRecordEntity.creatorId,
			securityCheck: fileRecordEntity.securityCheck,
			deletedSince: fileRecordEntity.deletedSince,
		};

		const fileRecordDO = fileRecordFactory.build(props);

		return fileRecordDO;
	}

	static entitiesToDOs(fileRecordEntities: FileRecordEntity[]): FileRecord[] {
		const fileRecordDOs = fileRecordEntities.map((fileRecordEntity) => FileRecordDOMapper.entityToDO(fileRecordEntity));

		return fileRecordDOs;
	}

	/* DO NOT WORK
	static getEntitiesFromDOs(fileRecords: FileRecord[]): FileRecordEntity[] {
		const props = fileRecords.map((fileRecord) => fileRecord.getProps());
		const entities = FileRecordDOMapper.createNewEntities(props);

		return entities;
	}
	*/

	static mergeDOsIntoEntities(fileRecords: FileRecord[], fileRecordEntities: FileRecordEntity[]) {
		fileRecords.forEach((fileRecord) => {
			const fileRecordEntity = fileRecordEntities.find((entity) => entity.id === fileRecord.id);
			if (fileRecordEntity) {
				FileRecordDOMapper.mergeDOintoEntity(fileRecord, fileRecordEntity);
			} else {
				throw new InternalServerErrorException('FileRecordDOMapper: ID not found.');
			}
		});
	}

	// For collection the ORM setter must be used.
	// For embedded entities it must implement to, but should be in a additional method? additional const before
	// On this place it is possible to match DOs that only include some of the entity keys.
	// We must make the descision if all keys of the DO should be added or only the possible updates for now?
	// Should no default values are added on this place?
	static mergeDOintoEntity(fileRecord: FileRecord, fileRecordEntity: FileRecordEntity) {
		if (fileRecord.id === fileRecordEntity.id) {
			const props = fileRecord.getProps();

			fileRecordEntity.securityCheck.updatedAt = props.securityCheck.updatedAt;
			fileRecordEntity.securityCheck.status = props.securityCheck.status;
			fileRecordEntity.securityCheck.reason = props.securityCheck.reason;
			fileRecordEntity.securityCheck.requestToken = props.securityCheck.requestToken;

			fileRecordEntity.name = props.name;
		} else {
			throw new InternalServerErrorException('FileRecordDOMapper: ID do not match');
		}
	}

	static createNewEntities(props: FileRecordParams[]): FileRecordEntity[] {
		const entities = props.map((p) => FileRecordDOMapper.createNewEntity(p));

		return entities;
	}

	static createNewEntity(props: FileRecordParams): FileRecordEntity {
		const entity = new FileRecordEntity(props);

		return entity;
	}
}
