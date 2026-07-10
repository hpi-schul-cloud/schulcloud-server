import { type ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { type ExternalTool } from '../../../external-tool/domain';
import { type SchoolExternalTool } from '../../../school-external-tool/domain';

export interface ToolLaunchParams {
	externalTool: ExternalTool;

	schoolExternalTool: SchoolExternalTool;

	contextExternalTool: ContextExternalToolLaunchable;
}
