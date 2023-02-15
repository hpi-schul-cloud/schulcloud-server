import { BaseDOProps } from '@shared/domain';
import { FileRecord, IFileRecordParams } from '../domain';
import { FileRecordEntity } from './filerecord.entity';

function getArray<T>(input: T | T[]): T[] {
	const result = Array.isArray(input) ? input : [input];

	return result;
}

// TODO: change naming Entity to Datarecord, or without entity
// TODO: BaseClass
export class FileRecordDOMapper {
	static entityToDO(fileRecordEntity: FileRecordEntity): FileRecord {
		const props: IFileRecordParams & BaseDOProps = {
			id: fileRecordEntity.id,
			size: fileRecordEntity.size,
			name: fileRecordEntity.name,
			mimeType: fileRecordEntity.mimeType,
			parentType: fileRecordEntity.parentType,
			parentId: fileRecordEntity._parentId.toString(),
			schoolId: fileRecordEntity._schoolId.toString(),
			creatorId: fileRecordEntity.creatorId,
			securityCheck: fileRecordEntity.securityCheck,
			deletedSince: fileRecordEntity.deletedSince,
		};

		const fileRecordDO = new FileRecord(props);

		return fileRecordDO;
	}

	static entitiesToDOs(fileRecordEntities: FileRecordEntity[]): FileRecord[] {
		const fileRecordDOs = fileRecordEntities.map((fileRecordEntity) => FileRecordDOMapper.entityToDO(fileRecordEntity));

		return fileRecordDOs;
	}

	// TODO: factory
	static createNewEntities(props: IFileRecordParams[]): FileRecordEntity[] {
		const propsArray = getArray(props);
		const entities = propsArray.map((p) => FileRecordDOMapper.createNewEntity(p));

		return entities;
	}

	static createNewEntity(props: IFileRecordParams): FileRecordEntity {
		const entity = new FileRecordEntity(props);

		return entity;
	}
}
