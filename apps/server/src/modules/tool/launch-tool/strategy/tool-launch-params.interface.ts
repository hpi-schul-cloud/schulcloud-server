import { ContextExternalToolDO, ExternalToolConfigDO, ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';

export interface IToolLaunchParams {
	externalToolDO: ExternalToolDO;
	schoolExternalToolDO: SchoolExternalToolDO;
	config: ExternalToolConfigDO;
	contextExternalToolDO: ContextExternalToolDO;
}
