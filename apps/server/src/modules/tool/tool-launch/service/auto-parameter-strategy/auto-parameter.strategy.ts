import { type ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { type SchoolExternalTool } from '../../../school-external-tool/domain';

export interface AutoParameterStrategy {
	getValue(
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): string | Promise<string | undefined> | undefined;
}
