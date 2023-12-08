import { AbstractEvent } from '@infra/event';
import { EntityId } from '@shared/domain/types';
import { ToolContextType } from '../../../common/enum';

interface ContextExternalToolDeletedContent {
	contextId: EntityId;

	contextType: ToolContextType;
}

export class ContextExternalToolDeletedEvent extends AbstractEvent<ContextExternalToolDeletedContent> {
	getEventName(): string {
		return 'tool.deleted';
	}

	payload: ContextExternalToolDeletedContent;

	constructor(payload: ContextExternalToolDeletedContent) {
		super();
		this.payload = payload;
	}
}
