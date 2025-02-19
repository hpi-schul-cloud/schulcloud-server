import { ContextExternalToolType } from '../../context-external-tool/repo/mikro-orm/context-external-tool-type.enum';

export class SchoolExternalToolMetadata {
	public contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(schoolExternalToolMetadata: SchoolExternalToolMetadata) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadata.contextExternalToolCountPerContext;
	}
}
