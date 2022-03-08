import { EntityId, FileRecord } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { Scope } from '../scope';

export class FileRecordScope extends Scope<FileRecord> {
	byParentId(parentId: EntityId): FileRecordScope {
		this.addQuery({ _parentId: new ObjectId(parentId) });
		return this;
	}

	bySchoolId(schoolId: EntityId): FileRecordScope {
		this.addQuery({ _schoolId: new ObjectId(schoolId) });
		return this;
	}

	bySecurityCheckRequestToken(token: string): FileRecordScope {
		this.addQuery({ securityCheck: { requestToken: token } });
		return this;
	}
}
