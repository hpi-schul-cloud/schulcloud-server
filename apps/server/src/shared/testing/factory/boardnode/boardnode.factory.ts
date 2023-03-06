import { BoardNode, BoardNodeProperties } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const boardNodeFactory = BaseFactory.define<BoardNode, BoardNodeProperties>(BoardNode, () => {
	return {};
});
