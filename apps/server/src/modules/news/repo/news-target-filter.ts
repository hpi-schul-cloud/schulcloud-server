import { EntityId } from '@shared/domain';
import { NewsTargetModel } from '@shared/domain/types/news.types';

export interface NewsTargetFilter {
	targetModel: NewsTargetModel;
	targetIds: EntityId[];
}
