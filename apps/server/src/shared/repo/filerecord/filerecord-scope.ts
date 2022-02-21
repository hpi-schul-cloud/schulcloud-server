import { EntityId, FileRecord } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { Scope } from '../scope';

export class FileRecordScope extends Scope<FileRecord> {
	byTargetId(targetId: EntityId): FileRecordScope {
		this.addQuery({ _targetId: new ObjectId(targetId) });
		return this;
	}

	bySchoolId(schoolId: EntityId): FileRecordScope {
		this.addQuery({ _schoolId: new ObjectId(schoolId) });
		return this;
	}
}
