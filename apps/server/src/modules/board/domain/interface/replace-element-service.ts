import { ContextExternalTool } from '../../../tool/context-external-tool/domain';

export interface ReplaceElementService {
	replaceElement(tool: ContextExternalTool): Promise<void>;
}
