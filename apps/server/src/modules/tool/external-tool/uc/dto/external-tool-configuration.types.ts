import { ExternalTool } from '../../domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';

export type AvailableToolsForContext = {
	externalTool: ExternalTool;
	schoolExternalTool: SchoolExternalTool;
};
