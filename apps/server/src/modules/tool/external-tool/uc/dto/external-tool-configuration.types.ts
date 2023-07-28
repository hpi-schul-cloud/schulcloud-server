import { ExternalToolDO } from '../../domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';

export type AvailableToolsForContext = {
	externalTool: ExternalToolDO;
	schoolExternalTool: SchoolExternalTool;
};
