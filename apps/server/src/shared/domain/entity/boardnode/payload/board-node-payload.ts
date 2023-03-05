import { Embeddable, Enum, Property } from '@mikro-orm/core';

export enum BoardNodeType {
	BOARD = 'board',
	COLUMN = 'column',
	CARD = 'card',
	ELEMENT = 'element',
}

@Embeddable({ discriminatorColumn: 'type' })
export abstract class BoardNodePayload implements BoardNodePayloadProps {
	constructor(props: BoardNodePayloadProps) {
		this.name = props.name;
	}

	@Enum(() => BoardNodeType)
	type!: BoardNodeType;

	@Property()
	name: string;
}

export interface BoardNodePayloadProps {
	name: string;
}
