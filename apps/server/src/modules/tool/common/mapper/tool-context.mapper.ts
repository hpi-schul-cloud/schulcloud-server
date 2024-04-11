import { ToolContextType } from '../enum';
import { ContextExternalToolType } from '../../context-external-tool/entity';

export class ToolContextMapper {
	static contextMapping: Record<ToolContextType, ContextExternalToolType> = {
		[ToolContextType.COURSE]: ContextExternalToolType.COURSE,
		[ToolContextType.BOARD_ELEMENT]: ContextExternalToolType.BOARD_ELEMENT,
		[ToolContextType.MEDIA_BOARD_ELEMENT]: ContextExternalToolType.MEDIA_SHELF,
	};
}
