import { NotImplementedException } from '@nestjs/common';
import { ShareTokenContextType } from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';

export class ShareTokenContextTypeMapper {
	static mapToAllowedAuthorizationEntityType(type: ShareTokenContextType): AllowedAuthorizationEntityType {
		const types: Map<ShareTokenContextType, AllowedAuthorizationEntityType> = new Map();
		types.set(ShareTokenContextType.School, AllowedAuthorizationEntityType.School);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
