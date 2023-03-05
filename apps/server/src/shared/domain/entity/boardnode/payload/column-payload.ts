import { Embeddable } from '@mikro-orm/core';
import { BoardNodePayload, BoardNodePayloadProps, BoardNodeType } from './board-node-payload';

@Embeddable({ discriminatorValue: BoardNodeType.COLUMN })
export class ColumnPayload extends BoardNodePayload implements ColumnPayloadProps {
	constructor(props: ColumnPayloadProps) {
		super(props);
		this.type = BoardNodeType.COLUMN;
	}
}

export interface ColumnPayloadProps extends BoardNodePayloadProps {}
