import { type EntityId } from '@shared/domain/types';
import { type NewsTargetModel } from '../domain/type/news-target-model.enum';

export interface NewsTargetFilter {
	targetModel: NewsTargetModel;
	targetIds: EntityId[];
}
