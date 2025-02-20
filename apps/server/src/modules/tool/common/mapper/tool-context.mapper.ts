import { ContextExternalToolType } from '../../context-external-tool/repo';
import { ToolContextType } from '../enum';

export class ToolContextMapper {
	public static contextMapping: Record<ToolContextType, ContextExternalToolType> = {
		[ToolContextType.COURSE]: ContextExternalToolType.COURSE,
		[ToolContextType.BOARD_ELEMENT]: ContextExternalToolType.BOARD_ELEMENT,
		[ToolContextType.MEDIA_BOARD]: ContextExternalToolType.MEDIA_BOARD,
	};
}
