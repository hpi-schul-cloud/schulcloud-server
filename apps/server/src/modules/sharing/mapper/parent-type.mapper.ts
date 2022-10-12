import { NotImplementedException } from '@nestjs/common';
import { ShareTokenParentType } from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';

export class ShareTokenParentTypeMapper {
	static mapToAllowedAuthorizationEntityType(type: ShareTokenParentType): AllowedAuthorizationEntityType {
		const types: Map<ShareTokenParentType, AllowedAuthorizationEntityType> = new Map();
		types.set(ShareTokenParentType.Course, AllowedAuthorizationEntityType.Course);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
