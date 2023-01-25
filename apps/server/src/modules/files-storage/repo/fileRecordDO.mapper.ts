import { BaseDOProps } from '@shared/domain';
import { FileRecord, FileRecordDO, FileRecordDOParams } from '../entity';

// TODO: change naming Entity to Datarecord, or without entity
export class FileRecordDOMapper {
	static entityToDO(fileRecordEntity: FileRecord): FileRecordDO {
		const props: FileRecordDOParams & BaseDOProps = {
			id: fileRecordEntity.id,
			size: fileRecordEntity.size,
			name: fileRecordEntity.name,
			mimeType: fileRecordEntity.mimeType,
			parentType: fileRecordEntity.parentType,
			parentId: fileRecordEntity._parentId.toString(),
			// lockedForUserId: fileRecordEntity._lockedForUserId,
			schoolId: fileRecordEntity._schoolId.toString(),
			creatorId: fileRecordEntity.creatorId,
			securityCheck: fileRecordEntity.securityCheck,
			deletedSince: fileRecordEntity.deletedSince,
		};

		const fileRecordDO = new FileRecordDO(props);

		return fileRecordDO;
	}

	static entitiesToDOs(fileRecordEntities: FileRecord[]): FileRecordDO[] {
		const fileRecordDOs = fileRecordEntities.map((fileRecordEntity) => FileRecordDOMapper.entityToDO(fileRecordEntity));

		return fileRecordDOs;
	}

	/*
	static DOToEntity(fileRecordDO: FileRecordDO): FileRecord {
		const props: IFileRecordProperties = {
			id: new ObjectId(fileRecordDO.props.id),
			size: fileRecordDO.props.size,
			name: fileRecordDO.props.name,
			mimeType: fileRecordDO.props.mimeType,
			parentType: fileRecordDO.props.parentType,
			_parentId: new ObjectId(fileRecordDO.props.parentId),
			// _lockedForUserId: fileRecordDO.props.lockedForUserId,
			_schoolId: fileRecordDO.props.schoolId,
			securityCheck: fileRecordDO.props.securityCheck,
			deletedSince: fileRecordDO.props.deletedSince,
		};

		const fileRecord = new FileRecord(props);

		return fileRecord;
	}
	*/
}
