import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory } from '@shared/testing/factory';
import { BoardNodeAuthorizable, BoardNodeAuthorizableProps } from '../domain';
import { columnBoardFactory } from './column-board.factory';
import { columnFactory } from './column.factory';

export const boardDoAuthorizableFactory = DomainObjectFactory.define<BoardNodeAuthorizable, BoardNodeAuthorizableProps>(
	BoardNodeAuthorizable,
	() => {
		const boardNode = columnFactory.build();
		const rootNode = columnBoardFactory.build({ children: [boardNode] });
		return {
			id: new ObjectId().toHexString(),
			users: [],
			boardNode,
			rootNode,
		};
	}
);
