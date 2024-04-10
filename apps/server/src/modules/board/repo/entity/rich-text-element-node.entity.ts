import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { InputFormat } from '@shared/domain/types';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.RICH_TEXT_ELEMENT })
export class RichTextElementNode extends BoardNode {
	@Property()
	text: string;

	@Property()
	inputFormat: InputFormat;

	constructor(props: RichTextElementNodeProps) {
		super(props);
		this.type = BoardNodeType.RICH_TEXT_ELEMENT;
		this.text = props.text;
		this.inputFormat = props.inputFormat;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildRichTextElement(this);
		return domainObject;
	}
}

export interface RichTextElementNodeProps extends BoardNodeProps {
	text: string;
	inputFormat: InputFormat;
}
