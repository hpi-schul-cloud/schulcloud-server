import { EntityId } from '@shared/domain/types/entity-id';
import { NewsTargetModel } from '@shared/domain/types/news.types';

export interface NewsTargetFilter {
	targetModel: NewsTargetModel;
	targetIds: EntityId[];
}
