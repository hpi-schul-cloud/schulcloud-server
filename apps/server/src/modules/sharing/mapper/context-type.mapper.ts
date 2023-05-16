import { NotImplementedException } from '@nestjs/common';
import { AllowedAuthorizationObjectType } from '@src/modules/authorization';
import { ShareTokenContextType } from '../domainobject/share-token.do';

export class ShareTokenContextTypeMapper {
	static mapToAllowedAuthorizationEntityType(type: ShareTokenContextType): AllowedAuthorizationObjectType {
		const types: Map<ShareTokenContextType, AllowedAuthorizationObjectType> = new Map();
		types.set(ShareTokenContextType.School, AllowedAuthorizationObjectType.School);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
