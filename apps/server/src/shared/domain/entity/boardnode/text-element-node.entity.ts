import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardDoBuilder } from './board-do.builder';
import { BoardNode, BoardNodeProperties } from './boardnode.entity';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.TEXT_ELEMENT })
export class TextElementNode extends BoardNode {
	@Property()
	text: string;

	constructor(props: TextElementNodeProperties) {
		super(props);
		this.type = BoardNodeType.TEXT_ELEMENT;
		this.text = props.text;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildTextElement(this);
		return domainObject;
	}
}

export interface TextElementNodeProperties extends BoardNodeProperties {
	text: string;
}
