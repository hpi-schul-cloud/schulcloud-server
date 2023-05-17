import { NotImplementedException } from '@nestjs/common';
import { AuthorizableReferenceType } from '@src/modules/authorization';
import { ShareTokenContextType } from '../domainobject/share-token.do';

export class ShareTokenContextTypeMapper {
	static mapToAllowedAuthorizationEntityType(type: ShareTokenContextType): AuthorizableReferenceType {
		const types: Map<ShareTokenContextType, AuthorizableReferenceType> = new Map();
		types.set(ShareTokenContextType.School, AuthorizableReferenceType.School);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
