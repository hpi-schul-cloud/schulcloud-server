import { EntityId } from '@shared/domain/types';

export class CopyContextExternalToolRejectData {
	readonly sourceContextExternalToolId: EntityId;

	readonly externalToolName: string;

	constructor(sourceContextExternalToolId: EntityId, externalToolName: string) {
		this.sourceContextExternalToolId = sourceContextExternalToolId;
		this.externalToolName = externalToolName;
	}
}
