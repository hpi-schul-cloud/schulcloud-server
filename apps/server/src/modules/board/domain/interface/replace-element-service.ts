import { ContentElementType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';

export interface ReplaceElementService {
	replaceElement(contextExternalToolId: EntityId, type: ContentElementType, title: string): Promise<void>;
}
