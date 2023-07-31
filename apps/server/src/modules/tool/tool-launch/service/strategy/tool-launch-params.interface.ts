import { ExternalTool } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { ContextExternalTool } from '../../../context-external-tool/domain';

export interface IToolLaunchParams {
	externalTool: ExternalTool;

	schoolExternalTool: SchoolExternalTool;

	contextExternalTool: ContextExternalTool;
}
