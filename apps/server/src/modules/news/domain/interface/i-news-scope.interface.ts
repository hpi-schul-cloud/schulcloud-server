import { type EntityId } from '@shared/domain/types/entity-id';
import { type NewsTargetModel } from '../type/news-target-model.enum';

/** interface for finding news with optional targetId */
export interface INewsScope {
	target?: { targetModel: NewsTargetModel; targetId?: EntityId };
	unpublished?: boolean;
}
