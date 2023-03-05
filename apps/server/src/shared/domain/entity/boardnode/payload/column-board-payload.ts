import { Embeddable } from '@mikro-orm/core';
import { BoardNodePayload, BoardNodePayloadProps, BoardNodeType } from './board-node-payload';

@Embeddable({ discriminatorValue: BoardNodeType.BOARD })
export class ColumnBoardPayload extends BoardNodePayload implements ColumnBoardPayloadProps {
	constructor(props: ColumnBoardPayloadProps) {
		super(props);
		this.type = BoardNodeType.BOARD;
	}
}

export interface ColumnBoardPayloadProps extends BoardNodePayloadProps {}
