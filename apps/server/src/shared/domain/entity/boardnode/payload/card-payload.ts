import { Embeddable, Property } from '@mikro-orm/core';
import { BoardNodePayload, BoardNodePayloadProps, BoardNodeType } from './board-node-payload';

@Embeddable({ discriminatorValue: BoardNodeType.CARD })
export class CardPayload extends BoardNodePayload implements CardPayloadProps {
	constructor(props: CardPayloadProps) {
		super({ name: props.name });
		this.type = BoardNodeType.CARD;
		this.height = props.height;
	}

	@Property()
	height: number;
}

export interface CardPayloadProps extends BoardNodePayloadProps {
	height: number;
}
