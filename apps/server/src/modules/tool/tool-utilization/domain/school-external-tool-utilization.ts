import { ContextExternalToolType } from '../../context-external-tool/repo';

export class SchoolExternalToolUtilization {
	public contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(schoolExternalToolMetadata: SchoolExternalToolUtilization) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadata.contextExternalToolCountPerContext;
	}
}
