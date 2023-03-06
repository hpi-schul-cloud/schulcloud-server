import { EntityId } from '@shared/domain/types';

export class ContentElement implements ContentElementProps {
	id: EntityId;

	createdAt: Date;

	updatedAt: Date;

	constructor(props: ContentElementProps) {
		this.id = props.id;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}

interface ContentElementProps {
	id: EntityId;

	createdAt: Date;

	updatedAt: Date;
}
