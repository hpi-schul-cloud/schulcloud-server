import { EntityId } from '@shared/domain/types';

// Reject as naming of a data reprasentation can be missunderstand. Please rename.
// Maybe this class is not needed anymore if the code is re-sorted.
export class CopyContextExternalToolRejectData {
	readonly sourceContextExternalToolId: EntityId;

	readonly externalToolName: string;

	constructor(sourceContextExternalToolId: EntityId, externalToolName: string) {
		this.sourceContextExternalToolId = sourceContextExternalToolId;
		this.externalToolName = externalToolName;
	}
}
