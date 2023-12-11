import { EntityId } from '@shared/domain/types';
import { ToolContextType } from '@modules/tool/common/enum';

export interface ContextExternalToolDeletedEventContent {
	contextId: EntityId;
	contextType: ToolContextType;
}
