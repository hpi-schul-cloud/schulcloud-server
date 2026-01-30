import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { NotImplementedException } from '@nestjs/common';
import { H5PContentParentType } from '../types';

export class H5PContentMapper {
	public static mapToAllowedAuthorizationEntityType(type: H5PContentParentType): AuthorizationBodyParamsReferenceType {
		const types: Map<H5PContentParentType, AuthorizationBodyParamsReferenceType> = new Map();

		types.set(H5PContentParentType.BoardElement, AuthorizationBodyParamsReferenceType.BOARDNODES);

		const res: AuthorizationBodyParamsReferenceType | undefined = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}

		return res;
	}
}
