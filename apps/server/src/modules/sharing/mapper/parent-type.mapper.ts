import { NotImplementedException } from '@nestjs/common';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { ShareTokenParentType } from '../domainobject/share-token.do';

export class ShareTokenParentTypeMapper {
	static mapToAllowedAuthorizationEntityType(type: ShareTokenParentType): AuthorizableReferenceType {
		const types: Map<ShareTokenParentType, AuthorizableReferenceType> = new Map();
		types.set(ShareTokenParentType.Course, AuthorizableReferenceType.Course);
		types.set(ShareTokenParentType.Lesson, AuthorizableReferenceType.Lesson);
		types.set(ShareTokenParentType.Task, AuthorizableReferenceType.Task);
		types.set(ShareTokenParentType.ColumnBoard, AuthorizableReferenceType.BoardNode);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}
}
