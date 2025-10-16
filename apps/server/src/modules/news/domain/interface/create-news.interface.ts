import { EntityId } from '@shared/domain/types/entity-id';
import { NewsTargetModel } from '../type';

/** news interface for ceating news */
export interface CreateNews {
	title: string;
	content: string;
	displayAt?: Date;
	target: { targetModel: NewsTargetModel; targetId: EntityId };
}
