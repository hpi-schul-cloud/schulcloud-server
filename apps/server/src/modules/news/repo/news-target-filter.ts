import { type EntityId } from '@shared/domain/types';
import { type NewsTargetModel } from '../domain';

export interface NewsTargetFilter {
	targetModel: NewsTargetModel;
	targetIds: EntityId[];
}
