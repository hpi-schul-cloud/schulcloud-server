import { EntityId } from '@shared/domain/types';

export type ToolDeleted = {
	title: string;

	contextExternalToolId: EntityId;
};

export class ContextExternalToolsDeletedEvent {
	deletedTools: ToolDeleted[];

	constructor(props: ContextExternalToolsDeletedEvent) {
		this.deletedTools = props.deletedTools;
	}
}
