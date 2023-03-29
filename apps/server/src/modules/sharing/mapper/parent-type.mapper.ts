import { NotImplementedException } from '@nestjs/common';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { ShareTokenParentType } from '../domainobject/share-token.do';

export class ShareTokenParentTypeMapper {
	static mapToAllowedAuthorizationEntityType(type: ShareTokenParentType): AllowedAuthorizationEntityType {
		const types: Map<ShareTokenParentType, AllowedAuthorizationEntityType> = new Map();
		types.set(ShareTokenParentType.Course, AllowedAuthorizationEntityType.Course);
		types.set(ShareTokenParentType.Lesson, AllowedAuthorizationEntityType.Lesson);
		types.set(ShareTokenParentType.Task, AllowedAuthorizationEntityType.Task);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
