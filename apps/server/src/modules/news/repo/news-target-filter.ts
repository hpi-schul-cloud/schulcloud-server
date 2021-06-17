import { EntityId } from '@shared/domain';
import { NewsTargetModelValue } from '../entity';

export interface NewsTargetFilter {
	targetModel: NewsTargetModelValue;
	targetIds: EntityId[];
}
