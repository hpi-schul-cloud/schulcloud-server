import { Embeddable, Property } from '@mikro-orm/core';
import { BoardNodePayload, BoardNodePayloadProps, BoardNodeType } from './board-node-payload';

@Embeddable({ discriminatorValue: BoardNodeType.CARD })
export class CardPayload extends BoardNodePayload implements CardPayloadProps {
	constructor(props: CardPayloadProps) {
		super({ name: props.name });
		this.type = BoardNodeType.CARD;
		this.title = props.title;
		this.height = props.height;
	}

	@Property()
	title?: string;

	@Property()
	height: number;
}

export interface CardPayloadProps extends BoardNodePayloadProps {
	title?: string;
	height: number;
}
