import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';

export interface AutoParameterStrategy {
	getValue(
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): string | Promise<string | undefined> | undefined;
}
