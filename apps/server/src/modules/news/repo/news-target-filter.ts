import { EntityId } from '@shared/domain/types';
import { NewsTargetModel } from '../domain';

export interface NewsTargetFilter {
	targetModel: NewsTargetModel;
	targetIds: EntityId[];
}
