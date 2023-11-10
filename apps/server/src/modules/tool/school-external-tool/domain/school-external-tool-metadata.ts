import { ToolContextType } from '../../common/enum';

export class SchoolExternalToolMetadata {
	contextExternalToolCountPerContext: Map<ToolContextType, number>;

	constructor(schoolExternalToolMetadata: SchoolExternalToolMetadata) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadata.contextExternalToolCountPerContext;
	}
}
