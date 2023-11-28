import { ContextExternalToolType } from '../../context-external-tool/entity';

export class ExternalToolMetadata {
	schoolExternalToolCount: number;

	contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(externalToolMetadata: ExternalToolMetadata) {
		this.schoolExternalToolCount = externalToolMetadata.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolMetadata.contextExternalToolCountPerContext;
	}
}
