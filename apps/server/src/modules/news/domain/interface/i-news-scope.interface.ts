import { EntityId } from '@shared/domain/types/entity-id';
import { NewsTargetModel } from '../type';

/** interface for finding news with optional targetId */
export interface INewsScope {
	target?: { targetModel: NewsTargetModel; targetId?: EntityId };
	unpublished?: boolean;
}
