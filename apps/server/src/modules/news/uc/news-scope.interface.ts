import { EntityId } from '../../../shared/domain';
import { NewsTargetModel } from '../entity';

export interface INewsScope {
	targetId: EntityId;
	targetModel: NewsTargetModel;
}
