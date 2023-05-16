import { NotImplementedException } from '@nestjs/common';
import { AllowedAuthorizationObjectType } from '@src/modules/authorization';
import { ShareTokenParentType } from '../domainobject/share-token.do';

export class ShareTokenParentTypeMapper {
	static mapToAllowedAuthorizationEntityType(type: ShareTokenParentType): AllowedAuthorizationObjectType {
		const types: Map<ShareTokenParentType, AllowedAuthorizationObjectType> = new Map();
		types.set(ShareTokenParentType.Course, AllowedAuthorizationObjectType.Course);
		types.set(ShareTokenParentType.Lesson, AllowedAuthorizationObjectType.Lesson);
		types.set(ShareTokenParentType.Task, AllowedAuthorizationObjectType.Task);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
