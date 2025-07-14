import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory } from '@testing/factory/domainobject';
import { BoardNodeAuthorizable, BoardNodeAuthorizableProps } from '../domain';
import { columnBoardFactory } from './column-board.factory';
import { columnFactory } from './column.factory';

export const boardNodeAuthorizableFactory = DomainObjectFactory.define<
	BoardNodeAuthorizable,
	BoardNodeAuthorizableProps
>(BoardNodeAuthorizable, () => {
	const boardNode = columnFactory.build();
	const rootNode = columnBoardFactory.build({ children: [boardNode] });
	return {
		id: new ObjectId().toHexString(),
		users: [],
		boardNode,
		rootNode,
		boardSettings: {},
	};
});
