import { type EntityId } from '@shared/domain/types';

export class CopyContextExternalToolRejectData {
	public readonly sourceContextExternalToolId: EntityId;

	public readonly externalToolName: string;

	constructor(sourceContextExternalToolId: EntityId, externalToolName: string) {
		this.sourceContextExternalToolId = sourceContextExternalToolId;
		this.externalToolName = externalToolName;
	}
}
