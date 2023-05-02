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
		// factory?
		const fileRecordEntity = new FileRecordEntity(props);
		fileRecordEntity.id = props.id;

		return fileRecordEntity;
	}
}

export const fileRecordDOMapper = new FileRecordDOMapper();

/*
// TODO: change naming Entity to Datarecord, or without entity
// TODO: include factory methods..

	// For collection the ORM setter must be used.
	// For embedded entities it must implement to, but should be in a additional method? additional const before
	// On this place it is possible to match DOs that only include some of the entity keys.
	// We must make the descision if all keys of the DO should be added or only the possible updates for now?
	// Should no default values are added on this place?

			entity {
				key1, --> bleibt unverändert
				key2, <-- wird überschrieben
				keyAndererNameA, <-- keyAndererNameB
				keyCollection <-- muss von Array auf collection übertragen werden
			}

			Do {
				key2,
				key3,
				keyArray,
				keyAndererNameB
			}
*/
