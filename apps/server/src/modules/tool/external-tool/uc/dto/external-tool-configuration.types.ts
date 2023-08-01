import { ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';

export type AvailableToolsForContext = {
	externalTool: ExternalToolDO;
	schoolExternalTool: SchoolExternalToolDO;
};
