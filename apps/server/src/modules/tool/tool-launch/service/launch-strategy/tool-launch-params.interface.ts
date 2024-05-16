import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { ExternalTool } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';

export interface ToolLaunchParams {
	externalTool: ExternalTool;

	schoolExternalTool: SchoolExternalTool;

	contextExternalTool: ContextExternalToolLaunchable;
}
