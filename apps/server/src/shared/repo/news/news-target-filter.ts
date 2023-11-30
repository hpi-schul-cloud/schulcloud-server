import { EntityId, NewsTargetModel } from '@shared/domain/types';

export interface NewsTargetFilter {
	targetModel: NewsTargetModel;
	targetIds: EntityId[];
}
