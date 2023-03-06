import { Entity, Property } from '@mikro-orm/core';
import { BoardNode, BoardNodeProperties } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.CARD })
export class CardNode extends BoardNode {
	constructor(props: CardNodeProperties) {
		super(props);
		this.type = BoardNodeType.CARD;
		this.height = props.height;
		this.title = props.title;
	}

	@Property()
	height: number;

	@Property()
	title: string;
}

export interface CardNodeProperties extends BoardNodeProperties {
	height: number;

	title: string;
}
