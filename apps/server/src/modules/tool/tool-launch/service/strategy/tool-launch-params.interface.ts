import { ExternalToolDO } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { ContextExternalTool } from '../../../context-external-tool/domain';

export interface IToolLaunchParams {
	externalToolDO: ExternalToolDO;

	schoolExternalToolDO: SchoolExternalTool;

	contextExternalToolDO: ContextExternalTool;
}
