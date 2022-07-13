import { NotImplementedException } from '@nestjs/common';
import { FileRecordParentType } from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';

export class FileStorageMapper {
	static mapToAllowedAuthorizationEntityType(type: FileRecordParentType): AllowedAuthorizationEntityType {
		const types: Map<FileRecordParentType, AllowedAuthorizationEntityType> = new Map();
		types.set(FileRecordParentType.Task, AllowedAuthorizationEntityType.Task);
		types.set(FileRecordParentType.Course, AllowedAuthorizationEntityType.Course);
		types.set(FileRecordParentType.User, AllowedAuthorizationEntityType.User);
		types.set(FileRecordParentType.School, AllowedAuthorizationEntityType.School);
		types.set(FileRecordParentType.Lesson, AllowedAuthorizationEntityType.Lesson);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
