import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { NotImplementedException } from '@nestjs/common';
import { H5PContentParentType } from '../entity';

export class H5PContentMapper {
	static mapToAllowedAuthorizationEntityType(type: H5PContentParentType): AuthorizationBodyParamsReferenceType {
		const types = new Map<H5PContentParentType, AuthorizationBodyParamsReferenceType>();

		types.set(H5PContentParentType.Lesson, AuthorizationBodyParamsReferenceType.LESSONS);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}

		return res;
	}
}
