import { ExternalToolDO } from '../../../external-tool/domain';
import { SchoolExternalToolDO } from '../../../school-external-tool/domain';
import { ContextExternalTool } from '../../../context-external-tool/domain';

export interface IToolLaunchParams {
	externalToolDO: ExternalToolDO;

	schoolExternalToolDO: SchoolExternalToolDO;

	contextExternalToolDO: ContextExternalTool;
}
