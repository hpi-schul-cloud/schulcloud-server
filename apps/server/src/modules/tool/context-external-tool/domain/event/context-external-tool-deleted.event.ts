import { EntityId } from '@shared/domain/types';

export class ContextExternalToolDeletedEvent {
	id: EntityId;

	title: string;

	description?: string;

	constructor(props: ContextExternalToolDeletedEvent) {
		this.id = props.id;
		this.title = props.title;
		this.description = props.description;
	}
}
