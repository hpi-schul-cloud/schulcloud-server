import { BoardDoAuthorizable, BoardDoAuthorizableProps } from '@shared/domain/domainobject/board';
import { ObjectId } from 'bson';
import { DomainObjectFactory } from '../domain-object.factory';

export const boardDoAuthorizableFactory = DomainObjectFactory.define<BoardDoAuthorizable, BoardDoAuthorizableProps>(
	BoardDoAuthorizable,
	() => {
		return {
			id: new ObjectId().toHexString(),
			users: [],
		};
	}
);
