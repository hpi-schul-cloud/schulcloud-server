import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardDoBuilder } from './board-do.builder';
import { BoardNode, BoardNodeProperties } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.COLUMN })
export class ColumnNode extends BoardNode {
	@Property()
	title: string;

	constructor(props: ColumnNodeProperties) {
		super(props);
		this.type = BoardNodeType.COLUMN;
		this.title = props.title;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumn(this);
		return domainObject;
	}
}

export interface ColumnNodeProperties extends BoardNodeProperties {
	title: string;
}
