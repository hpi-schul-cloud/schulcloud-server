import { Embeddable, Property } from '@mikro-orm/core';
import { BoardNodePayload, BoardNodePayloadProps, BoardNodeType } from './board-node-payload';

@Embeddable({ discriminatorValue: BoardNodeType.TEXT_ELEMENT })
export class TextElementPayload extends BoardNodePayload implements TextElementPayloadProps {
	constructor(props: TextElementPayloadProps) {
		super({ name: props.name });
		this.type = BoardNodeType.TEXT_ELEMENT;
		this.text = props.text;
	}

	@Property()
	text: string;
}

export interface TextElementPayloadProps extends BoardNodePayloadProps {
	text: string;
}
