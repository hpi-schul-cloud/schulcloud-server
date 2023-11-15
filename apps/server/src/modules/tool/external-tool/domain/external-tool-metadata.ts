export class ExternalToolMetadata {
	schoolExternalToolCount: number;

	contextExternalToolCountPerContext: Record<string, number>;

	constructor(externalToolMetadata: ExternalToolMetadata) {
		this.schoolExternalToolCount = externalToolMetadata.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolMetadata.contextExternalToolCountPerContext;
	}
}
