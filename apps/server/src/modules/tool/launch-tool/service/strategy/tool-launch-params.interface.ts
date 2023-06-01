import { ContextExternalToolDO, ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';

export interface IToolLaunchParams {
	externalToolDO: ExternalToolDO;
	schoolExternalToolDO: SchoolExternalToolDO;
	contextExternalToolDO: ContextExternalToolDO;
}
