import { EntityManager } from '@mikro-orm/mongodb';
import { FileRecord, FileRecordSecurityCheck } from '../../domain';
import { FileRecordFactory } from '../../domain/file-record.factory';
import { FileRecordEntity, FileRecordSecurityCheckEmbeddable } from '../file-record.entity';

export class FileRecordEntityMapper {
	public static mapEntityToDo(fileRecordEntity: FileRecordEntity): FileRecord {
		// check identity map reference
		if (fileRecordEntity.domainObject) {
			return fileRecordEntity.domainObject;
		}

		const {
			createdAt,
			updatedAt,
			securityCheck: securityCheckEmbeddable,
			domainObject,
			...fileRecordProps
		} = fileRecordEntity;
		// we need to convert "fill" the "id" property manually
		fileRecordProps.id = fileRecordEntity._id.toHexString();

		const securityCheck = new FileRecordSecurityCheck(securityCheckEmbeddable);
		// It is very important to hand over "fileRecordProps" CLEAN (meaning no additional properties)!!!
		const fileRecord = FileRecordFactory.buildFromFileRecordProps(fileRecordProps, securityCheck);

		// attach to identity map
		fileRecordEntity.domainObject = fileRecord;

		return fileRecord;
	}

	public static mapDoToEntity(em: EntityManager, fileRecord: FileRecord): FileRecordEntity {
		const props = fileRecord.getProps();

		if (!(props instanceof FileRecordEntity)) {
			const entity =
				em.getUnitOfWork().getById<FileRecordEntity>(FileRecordEntity.name, props.id) || new FileRecordEntity();
			em.assign(entity, props);

			entity.securityCheck = FileRecordEntityMapper.mapDoToEmbeddable(em, fileRecord);

			return entity;
		}

		return props;
	}

	private static mapDoToEmbeddable(em: EntityManager, fileRecord: FileRecord): FileRecordSecurityCheckEmbeddable {
		const securityCheckProps = fileRecord.getSecurityCheckProps();

		const embeddable = new FileRecordSecurityCheckEmbeddable();
		em.assign(embeddable, securityCheckProps);

		return embeddable;
	}
}
