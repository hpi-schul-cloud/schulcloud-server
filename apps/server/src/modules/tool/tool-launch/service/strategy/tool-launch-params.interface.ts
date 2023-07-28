import { ExternalToolDO } from '../../../external-tool/domain';
import { SchoolExternalToolDO } from '../../../school-external-tool/domain';
import { ContextExternalToolDO } from '../../../context-external-tool/domain';

export interface IToolLaunchParams {
	externalToolDO: ExternalToolDO;

	schoolExternalToolDO: SchoolExternalToolDO;

	contextExternalToolDO: ContextExternalToolDO;
}
