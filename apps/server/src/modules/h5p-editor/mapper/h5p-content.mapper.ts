import { NotImplementedException } from '@nestjs/common';
import { AuthorizableReferenceType } from '@src/modules/authorization';
import { H5PContentParentType } from '../entity';

export class H5PContentMapper {
	static mapToAllowedAuthorizationEntityType(type: H5PContentParentType): AuthorizableReferenceType {
		const types = new Map<H5PContentParentType, AuthorizableReferenceType>();

		types.set(H5PContentParentType.Lesson, AuthorizableReferenceType.Lesson);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}

		return res;
	}
}
