import { ExternalToolDO } from '../../domain';
import { SchoolExternalToolDO } from '../../../school-external-tool/domain';

export type AvailableToolsForContext = {
	externalTool: ExternalToolDO;
	schoolExternalTool: SchoolExternalToolDO;
};
