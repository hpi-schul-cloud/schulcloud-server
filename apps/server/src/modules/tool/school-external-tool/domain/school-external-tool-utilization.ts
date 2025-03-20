import { ContextExternalToolType } from '../../context-external-tool/repo/mikro-orm/context-external-tool-type.enum';

export class SchoolExternalToolUtilization {
	public contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(schoolExternalToolMetadata: SchoolExternalToolUtilization) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadata.contextExternalToolCountPerContext;
	}
}
