import { AbstractEvent } from '@infra/event';
import { ContextExternalToolDeletedEventContent } from './context-external-tool-deleted-event-content';

export class ContextExternalToolsDeletedEvent extends AbstractEvent<ContextExternalToolDeletedEventContent[]> {
	getEventName(): string {
		return 'tool.deleted';
	}

	payload: ContextExternalToolDeletedEventContent[];

	constructor(payload: ContextExternalToolDeletedEventContent[]) {
		super();
		this.payload = payload;
	}
}
