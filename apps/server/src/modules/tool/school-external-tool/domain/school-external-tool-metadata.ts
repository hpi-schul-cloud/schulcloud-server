import { ContextExternalToolType } from '../../context-external-tool/entity';

export class SchoolExternalToolMetadata {
	contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(schoolExternalToolMetadata: SchoolExternalToolMetadata) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadata.contextExternalToolCountPerContext;
	}
}
