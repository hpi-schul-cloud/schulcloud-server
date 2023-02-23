import { EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { Scope } from '@shared/repo';
import { FileRecordEntity } from './filerecord.entity';
import { FileRecord } from '../domain';

export class FileRecordScope extends Scope<FileRecordEntity> {
	byParentId(parentId: EntityId): FileRecordScope {
		this.addQuery({ _parentId: new ObjectId(parentId) });

		return this;
	}

	byFileRecordId(fileRecordId: EntityId): FileRecordScope {
		this.addQuery({ id: fileRecordId });

		return this;
	}

	bySchoolId(schoolId: EntityId): FileRecordScope {
		this.addQuery({ _schoolId: new ObjectId(schoolId) });

		return this;
	}

	byIds(fileRecordEntities: FileRecord[]): FileRecordScope {
		const ids = fileRecordEntities.map((fileRecord) => fileRecord.id);
		this.addQuery({ id: { $in: ids } });

		return this;
	}

	bySecurityCheckRequestToken(token: string): FileRecordScope {
		this.addQuery({ securityCheck: { requestToken: token } });

		return this;
	}

	byMarkedForDelete(isMarked = true): FileRecordScope {
		const query = isMarked ? { deletedSince: { $ne: null } } : { deletedSince: null };
		this.addQuery(query);

		return this;
	}
}
