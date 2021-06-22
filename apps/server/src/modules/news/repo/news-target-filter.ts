import { EntityId } from '@shared/domain';
import { NewsTargetModel } from '../entity';

export interface NewsTargetFilter {
	targetModel: NewsTargetModel;
	targetIds: EntityId[];
}
