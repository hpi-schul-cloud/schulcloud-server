import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { H5PContentParentType } from '@infra/rabbitmq';
import { NotImplementedException } from '@nestjs/common';

export class H5PContentMapper {
	public static mapToAllowedAuthorizationEntityType(type: H5PContentParentType): AuthorizationBodyParamsReferenceType {
		const types: Map<H5PContentParentType, AuthorizationBodyParamsReferenceType> = new Map();

		types.set(H5PContentParentType.Lesson, AuthorizationBodyParamsReferenceType.LESSONS);
		types.set(H5PContentParentType.BoardElement, AuthorizationBodyParamsReferenceType.BOARDNODES);

		const res: AuthorizationBodyParamsReferenceType | undefined = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}

		return res;
	}
}
