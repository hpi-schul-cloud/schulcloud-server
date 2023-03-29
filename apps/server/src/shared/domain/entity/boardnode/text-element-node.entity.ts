import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardDoBuilder } from './board-do.builder';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.TEXT_ELEMENT })
export class TextElementNode extends BoardNode {
	@Property()
	text: string;

	constructor(props: TextElementNodeProps) {
		super(props);
		this.type = BoardNodeType.TEXT_ELEMENT;
		this.text = props.text;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildTextElement(this);
		return domainObject;
	}
}

export interface TextElementNodeProps extends BoardNodeProps {
	text: string;
}
