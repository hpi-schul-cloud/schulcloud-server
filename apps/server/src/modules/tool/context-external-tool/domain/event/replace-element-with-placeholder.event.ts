import { ContentElementType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';

export class ReplaceElementWithPlaceholderEvent {
	type: ContentElementType;

	title: string | undefined;

	contextExternalToolId: EntityId;

	constructor(contextExternalToolId: EntityId, type: ContentElementType, title: string | undefined) {
		this.type = type;
		this.title = title;
		this.contextExternalToolId = contextExternalToolId;
	}
}
