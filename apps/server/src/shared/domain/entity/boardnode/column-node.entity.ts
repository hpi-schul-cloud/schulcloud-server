import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardDoBuilder } from './board-do.builder';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.COLUMN })
export class ColumnNode extends BoardNode {
	@Property({ nullable: true })
	title?: string;

	constructor(props: ColumnNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN;
		this.title = props.title;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumn(this);
		return domainObject;
	}
}

export interface ColumnNodeProps extends BoardNodeProps {
	title?: string;
}
