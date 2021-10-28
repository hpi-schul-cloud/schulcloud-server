import { EntityId, NewsTargetModel } from '@shared/domain';

export interface NewsTargetFilter {
	targetModel: NewsTargetModel;
	targetIds: EntityId[];
}
