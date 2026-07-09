import { type EntityId } from '@shared/domain/types';

export class ContextExternalToolDeletedEvent {
	public id: EntityId;

	public title: string;

	public description?: string;

	constructor(props: ContextExternalToolDeletedEvent) {
		this.id = props.id;
		this.title = props.title;
		this.description = props.description;
	}
}
