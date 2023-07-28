import { ExternalToolDO } from '../../../external-tool/domainobject';
import { SchoolExternalToolDO } from '../../../school-external-tool/domainobject';
import { ContextExternalToolDO } from '../../../context-external-tool/domainobject';

export interface IToolLaunchParams {
	externalToolDO: ExternalToolDO;

	schoolExternalToolDO: SchoolExternalToolDO;

	contextExternalToolDO: ContextExternalToolDO;
}
