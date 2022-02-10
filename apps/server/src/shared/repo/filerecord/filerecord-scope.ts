import { EntityId, FileRecord, FileRecordTargetType } from '@shared/domain';
import { Scope } from '../scope';

export class FileRecordScope extends Scope<FileRecord> {
	byTargetType(targetType: FileRecordTargetType): FileRecordScope {
		this.addQuery({ targetType });
		return this;
	}

	byTargetId(targetId: EntityId): FileRecordScope {
		this.addQuery({ target: targetId });
		return this;
	}
}
