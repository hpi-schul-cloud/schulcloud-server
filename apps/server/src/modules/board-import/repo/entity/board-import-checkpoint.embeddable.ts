import { Embeddable, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

export interface BoardImportCheckpointEmbeddableProps {
	columnId: ObjectId;
	cardIds: ObjectId[];
}

@Embeddable()
export class BoardImportCheckpointEmbeddable {
	@Property()
	columnId: ObjectId;

	@Property()
	cardIds: ObjectId[];

	constructor(props: BoardImportCheckpointEmbeddableProps) {
		this.columnId = props.columnId;
		this.cardIds = props.cardIds;
	}
}
