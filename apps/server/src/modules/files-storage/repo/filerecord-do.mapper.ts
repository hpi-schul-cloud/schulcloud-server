import { BaseDOMapper } from '@shared/domain';
import { FileRecord, fileRecordFactory, FileRecordParams } from '../domain';
import { FileRecordEntity } from './filerecord.entity';

class FileRecordDOMapper extends BaseDOMapper<FileRecordParams, FileRecord, FileRecordEntity> {
	public entityToDO(fileRecordEntity: FileRecordEntity): FileRecord {
		const props: FileRecordParams = {
			id: fileRecordEntity.id,
			size: fileRecordEntity.size,
			name: fileRecordEntity.name,
			mimeType: fileRecordEntity.mimeType,
			parentType: fileRecordEntity.parentType,
			parentId: fileRecordEntity.parentId,
			schoolId: fileRecordEntity.schoolId,
			creatorId: fileRecordEntity.creatorId,
			securityCheck: fileRecordEntity.securityCheck,
			deletedSince: fileRecordEntity.deletedSince,
		};

		const fileRecordDO = fileRecordFactory.build(props);

		return fileRecordDO;
	}

	// passt für mehre DOs die auf eine entity zeigen
	// passt nicht für mehre entities die auf ein DO zeigen!!!

	public mergeDOintoEntity(fileRecord: FileRecord, fileRecordEntity: FileRecordEntity): void {
		const props = this.getValidProps(fileRecord, fileRecordEntity);

		fileRecordEntity.securityCheck.updatedAt = props.securityCheck.updatedAt;
		fileRecordEntity.securityCheck.status = props.securityCheck.status;
		fileRecordEntity.securityCheck.reason = props.securityCheck.reason;
		fileRecordEntity.securityCheck.requestToken = props.securityCheck.requestToken;

		fileRecordEntity.name = props.name;
	}

	// Das brauchen wir auch irgendwo..
	public createEntity(fileRecord: FileRecord): FileRecordEntity {
		const props = fileRecord.getProps();
		// TODO:
		// I think the entity factory is missed, we can not create with or without id over constructor.
		// The id is optional in entity props, but not mapped in constructor.
		const fileRecordEntity = new FileRecordEntity(props);
		fileRecordEntity.id = props.id;

		return fileRecordEntity;
	}
}

export const fileRecordDOMapper = new FileRecordDOMapper();
