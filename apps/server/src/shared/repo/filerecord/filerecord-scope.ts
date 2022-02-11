import { EntityId, FileRecord, FileRecordTargetType } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { Scope } from '../scope';

export class FileRecordScope extends Scope<FileRecord> {
	byTargetType(targetType: FileRecordTargetType): FileRecordScope {
		this.addQuery({ targetType });
		return this;
	}

	byTargetId(targetId: EntityId): FileRecordScope {
		this.addQuery({ _targetId: new ObjectId(targetId) });
		return this;
	}

	bySchoolId(schoolId: EntityId): FileRecordScope {
		this.addQuery({ _schoolId: new ObjectId(schoolId) });
		return this;
	}
}
