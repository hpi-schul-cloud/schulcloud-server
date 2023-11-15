export class SchoolExternalToolMetadata {
	contextExternalToolCountPerContext: Record<string, number>;

	constructor(schoolExternalToolMetadata: SchoolExternalToolMetadata) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadata.contextExternalToolCountPerContext;
	}
}
