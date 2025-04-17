import { ContextExternalToolType } from '../../context-external-tool/repo';

export class ExternalToolUtilization {
	public schoolExternalToolCount: number;

	public contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(externalToolUtilization: ExternalToolUtilization) {
		this.schoolExternalToolCount = externalToolUtilization.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolUtilization.contextExternalToolCountPerContext;
	}
}
