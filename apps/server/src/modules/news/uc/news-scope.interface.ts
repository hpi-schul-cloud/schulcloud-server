import { EntityId } from '../../../shared/domain';
import { NewsTargetModel } from '../entity';

export interface INewsScope {
	targetModel: NewsTargetModel | 'school';
	targetId: EntityId;
}
