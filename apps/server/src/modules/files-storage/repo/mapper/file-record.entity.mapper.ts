import { FileRecord, FileRecordSecurityCheck } from '../../domain';
import { FileRecordEntity } from '../file-record.entity';

export class FileRecordEntityMapper {
	public static mapEntityToDo(fileRecordEntity: FileRecordEntity): FileRecord {
		// check identity map reference
		if (fileRecordEntity.domainObject) {
			return fileRecordEntity.domainObject;
		}

		fileRecordEntity.securityCheck = new FileRecordSecurityCheck(fileRecordEntity.securityCheck);

		const room = new FileRecord(fileRecordEntity);

		// attach to identity map
		fileRecordEntity.domainObject = room;

		return room;
	}

	public static mapDoToEntity(fileRecord: FileRecord): FileRecordEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = fileRecord;
		// TODO: add proper handling of security check

		if (!(props instanceof FileRecordEntity)) {
			const entity = new FileRecordEntity();
			Object.assign(entity, props);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			fileRecord.props = entity;

			return entity;
		}

		return props;
	}
}
