import { DeepPartial } from '@mikro-orm/core';
import { BoardNode, BoardNodeProperties, BoardNodeType } from '@shared/domain';
import { BaseFactory } from './base.factory';

class BoardNodeFactory extends BaseFactory<BoardNode, BoardNodeProperties> {
	asBoard(): this {
		const params: DeepPartial<BoardNodeProperties> = { type: BoardNodeType.BOARD };
		return this.params(params);
	}

	asColumn(): this {
		const params: DeepPartial<BoardNodeProperties> = { type: BoardNodeType.COLUMN };
		return this.params(params);
	}

	asCard(): this {
		const params: DeepPartial<BoardNodeProperties> = { type: BoardNodeType.CARD };
		return this.params(params);
	}

	asElement(): this {
		const params: DeepPartial<BoardNodeProperties> = { type: BoardNodeType.ELEMENT };
		return this.params(params);
	}
}

export const boardNodeFactory = BoardNodeFactory.define(BoardNode, () => {
	return {
		type: BoardNodeType.BOARD,
	};
});
