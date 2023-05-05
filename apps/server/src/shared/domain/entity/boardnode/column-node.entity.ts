import { Entity } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.COLUMN })
export class ColumnNode extends BoardNode {
	constructor(props: BoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumn(this);
		return domainObject;
	}
}
