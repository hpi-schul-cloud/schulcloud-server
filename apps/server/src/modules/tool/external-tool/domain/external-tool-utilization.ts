import { ContextExternalToolType } from '../../context-external-tool/entity';

export class ExternalToolUtilization {
	schoolExternalToolCount: number;

	contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(externalToolUtilization: ExternalToolUtilization) {
		this.schoolExternalToolCount = externalToolUtilization.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolUtilization.contextExternalToolCountPerContext;
	}
}
