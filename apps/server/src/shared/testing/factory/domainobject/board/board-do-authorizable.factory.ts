import { BoardDoAuthorizable, BoardDoAuthorizableProps } from '@shared/domain/domainobject/board';
import { ObjectId } from 'bson';
import { DomainObjectFactory } from '../domain-object.factory';
import { columnFactory } from './column.do.factory';
import { columnBoardFactory } from './column-board.do.factory';

export const boardDoAuthorizableFactory = DomainObjectFactory.define<BoardDoAuthorizable, BoardDoAuthorizableProps>(
	BoardDoAuthorizable,
	() => {
		const boardDo = columnFactory.build();
		const rootDo = columnBoardFactory.build({ children: [boardDo] });
		return {
			id: new ObjectId().toHexString(),
			users: [],
			boardDo,
			rootDo,
		};
	}
);
