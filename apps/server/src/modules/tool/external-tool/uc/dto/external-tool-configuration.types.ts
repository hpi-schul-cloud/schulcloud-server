import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { ExternalTool } from '../../domain';

export type ContextExternalToolTemplateInfo = {
	externalTool: ExternalTool;

	schoolExternalTool: SchoolExternalTool;
};
