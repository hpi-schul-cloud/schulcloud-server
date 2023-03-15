import { EntityId } from '@shared/domain/types';

export class TextElement implements TextElementProps {
	id: EntityId;

	text: string;

	createdAt: Date;

	updatedAt: Date;

	constructor(props: TextElementProps) {
		this.id = props.id;
		this.text = props.text;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}

interface TextElementProps {
	id: EntityId;

	text: string;

	createdAt: Date;

	updatedAt: Date;
}
