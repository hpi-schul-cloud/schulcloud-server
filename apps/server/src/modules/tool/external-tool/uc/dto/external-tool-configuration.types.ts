import { type SchoolExternalTool } from '../../../school-external-tool/domain';
import { type ExternalTool } from '../../domain';

export type ContextExternalToolTemplateInfo = {
	externalTool: ExternalTool;

	schoolExternalTool: SchoolExternalTool;
};
