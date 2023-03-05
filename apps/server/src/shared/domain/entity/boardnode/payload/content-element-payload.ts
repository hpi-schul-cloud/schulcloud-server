import { Embeddable } from '@mikro-orm/core';
import { BoardNodePayload, BoardNodePayloadProps, BoardNodeType } from './board-node-payload';

@Embeddable({ discriminatorValue: BoardNodeType.ELEMENT })
export class ContentElementPlayload extends BoardNodePayload implements ContentElementPayloadProps {
	constructor(props: ContentElementPayloadProps) {
		super(props);
		this.type = BoardNodeType.ELEMENT;
	}
}

export interface ContentElementPayloadProps extends BoardNodePayloadProps {}
