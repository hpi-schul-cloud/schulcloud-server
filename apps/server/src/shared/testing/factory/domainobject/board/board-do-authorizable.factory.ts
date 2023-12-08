import { BoardDoAuthorizableProps } from '@shared/domain/domainobject/board';
import { BoardDoAuthorizable, UserRoleEnum } from '@shared/domain/domainobject/board/types/board-do-authorizable';
import { ObjectId } from 'bson';
import { DomainObjectFactory } from '../domain-object.factory';

export const boardDoAuthorizableFactory = DomainObjectFactory.define<BoardDoAuthorizable, BoardDoAuthorizableProps>(
	BoardDoAuthorizable,
	() => {
		return {
			id: new ObjectId().toHexString(),
			users: [],
			requiredUserRole: UserRoleEnum.STUDENT,
		};
	}
);
