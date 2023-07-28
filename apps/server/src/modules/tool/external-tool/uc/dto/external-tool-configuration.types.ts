import { ExternalToolDO } from '../../domainobject';
import { SchoolExternalToolDO } from '../../../school-external-tool/domainobject';

export type AvailableToolsForContext = {
	externalTool: ExternalToolDO;
	schoolExternalTool: SchoolExternalToolDO;
};
