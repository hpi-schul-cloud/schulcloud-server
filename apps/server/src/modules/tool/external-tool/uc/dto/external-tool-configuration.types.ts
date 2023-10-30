import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain/school-external-tool.do';
import { ExternalTool } from '../../domain/external-tool.do';

export type ContextExternalToolTemplateInfo = {
	externalTool: ExternalTool;

	schoolExternalTool: SchoolExternalTool;
};
