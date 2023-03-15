import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardDoBuilder } from './board-do.builder';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
export class ColumnBoardNode extends BoardNode {
	@Property()
	title: string;

	constructor(props: ColumnBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;
		this.title = props.title;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumnBoard(this);
		return domainObject;
	}
}

export interface ColumnBoardNodeProps extends BoardNodeProps {
	title: string;
}
