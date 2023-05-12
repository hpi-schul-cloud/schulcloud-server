import { Entity } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
export class ColumnBoardNode extends BoardNode {
	constructor(props: BoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumnBoard(this);
		return domainObject;
	}
}
