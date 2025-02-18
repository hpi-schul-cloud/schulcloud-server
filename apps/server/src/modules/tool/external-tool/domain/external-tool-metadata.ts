import { ContextExternalToolType } from '../../context-external-tool/repo';

export class ExternalToolMetadata {
	public schoolExternalToolCount: number;

	public contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(externalToolMetadata: ExternalToolMetadata) {
		this.schoolExternalToolCount = externalToolMetadata.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolMetadata.contextExternalToolCountPerContext;
	}
}
