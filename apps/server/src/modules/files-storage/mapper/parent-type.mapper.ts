import { NotImplementedException } from '@nestjs/common';
import { FileRecordParentType } from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';

export class FileStorageMapper {
	static mapToAllowedAuthorizationEntityType(type: FileRecordParentType): AllowedAuthorizationEntityType {
		let result: AllowedAuthorizationEntityType;
		if (type === FileRecordParentType.Course) {
			result = AllowedAuthorizationEntityType.Course;
		} else if (type === FileRecordParentType.Task) {
			result = AllowedAuthorizationEntityType.Task;
		} else if (type === FileRecordParentType.School) {
			result = AllowedAuthorizationEntityType.School;
		} else if (type === FileRecordParentType.User) {
			result = AllowedAuthorizationEntityType.User;
		} else {
			throw new NotImplementedException();
		}
		return result;
	}
}
