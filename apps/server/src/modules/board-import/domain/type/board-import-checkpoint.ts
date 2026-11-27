import { type EntityId } from '@shared/domain/types';

// One created column of the board plan with its created cards. The checkpoints of a job and the cards of a
// checkpoint have the order of the plan, so the position links a checkpoint to its part of the plan.
export interface BoardImportCheckpoint {
	columnId: EntityId;
	cardIds: EntityId[];
}
