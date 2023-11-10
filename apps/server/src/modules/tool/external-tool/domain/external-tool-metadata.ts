import { ToolContextType } from '../../common/enum';

export class ExternalToolMetadata {
	schoolExternalToolCount: number;

	contextExternalToolCountPerContext: Map<ToolContextType, number>;

	constructor(externalToolMetadata: ExternalToolMetadata) {
		this.schoolExternalToolCount = externalToolMetadata.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolMetadata.contextExternalToolCountPerContext;
	}
}
