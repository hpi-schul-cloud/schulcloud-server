import { Embeddable, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Embeddable()
export class BoardImportCheckpointEmbeddable {
	@Property()
	columnId: ObjectId;

	@Property()
	cardIds: ObjectId[];

	constructor(props: BoardImportCheckpointEmbeddable) {
		this.columnId = props.columnId;
		this.cardIds = props.cardIds;
	}
}
