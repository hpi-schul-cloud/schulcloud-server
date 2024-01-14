/* istanbul ignore file */
import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { BoardNode, BoardNodeProps } from './board-node.do';
import { INITIAL_PATH } from './path-utils';

export const boardNodeFactory = BaseFactory.define<BoardNode, BoardNodeProps>(BoardNode, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		path: INITIAL_PATH,
		level: 0,
		title: `column board #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
