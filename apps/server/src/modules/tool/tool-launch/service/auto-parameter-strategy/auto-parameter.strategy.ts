import { ContextExternalTool } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';

export interface AutoParameterStrategy {
	getValue(
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): string | Promise<string | undefined> | undefined;
}
