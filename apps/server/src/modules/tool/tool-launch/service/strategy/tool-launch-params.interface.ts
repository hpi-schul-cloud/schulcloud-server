import { ContextExternalTool } from '@src/modules/tool/context-external-tool/domain/context-external-tool.do';
import { ExternalTool } from '@src/modules/tool/external-tool/domain/external-tool.do';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain/school-external-tool.do';

export interface IToolLaunchParams {
	externalTool: ExternalTool;

	schoolExternalTool: SchoolExternalTool;

	contextExternalTool: ContextExternalTool;
}
