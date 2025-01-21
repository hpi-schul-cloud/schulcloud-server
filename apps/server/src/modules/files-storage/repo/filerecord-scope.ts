import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { FileRecord } from '../entity';
import { StorageLocation } from '../interface';

export class FileRecordScope extends Scope<FileRecord> {
	byParentId(parentId: EntityId): FileRecordScope {
		this.addQuery({ _parentId: new ObjectId(parentId) });

		return this;
	}

	byFileRecordId(fileRecordId: EntityId): FileRecordScope {
		this.addQuery({ id: fileRecordId });

		return this;
	}

	byStorageType(storageLocation: StorageLocation): FileRecordScope {
		this.addQuery({ storageLocation });

		return this;
	}

	byStorageLocationId(storageLocationId: EntityId): FileRecordScope {
		this.addQuery({ _storageLocationId: new ObjectId(storageLocationId) });

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

	byCreatorId(creatorId: EntityId): FileRecordScope {
		this.addQuery({ _creatorId: new ObjectId(creatorId) });

		return this;
	}
}
