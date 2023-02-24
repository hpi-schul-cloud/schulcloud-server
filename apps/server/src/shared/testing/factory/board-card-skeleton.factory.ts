import { CardSkeleton, CardSkeletonProps } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { legacyTaskReferenceCardFactory } from './legacy-task-reference-card.factory';

export const cardSkeletonFactory = BaseFactory.define<CardSkeleton, CardSkeletonProps>(CardSkeleton, () => {
	return {
		height: 208,
		card: legacyTaskReferenceCardFactory.buildWithId(),
	};
});
