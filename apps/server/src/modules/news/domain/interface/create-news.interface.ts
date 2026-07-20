import { type EntityId } from '@shared/domain/types/entity-id';
import { type NewsTargetModel } from '../type/news-target-model.enum';

/** news interface for ceating news */
export interface CreateNews {
	title: string;
	content: string;
	displayAt?: Date;
	target: { targetModel: NewsTargetModel; targetId: EntityId };
}
