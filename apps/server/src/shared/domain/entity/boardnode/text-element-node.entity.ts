import { Entity, Property } from '@mikro-orm/core';
import { BoardNode, BoardNodeProperties } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.TEXT_ELEMENT })
export class TextElementNode extends BoardNode {
	constructor(props: TextElementNodeProperties) {
		super(props);
		this.type = BoardNodeType.TEXT_ELEMENT;
		this.text = props.text;
	}

	@Property()
	text: string;
}

export interface TextElementNodeProperties extends BoardNodeProperties {
	text: string;
}
