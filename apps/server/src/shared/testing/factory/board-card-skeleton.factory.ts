import { CardSkeleton, CardSkeletonProps } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { legacyTaskReferenceCardFactory } from './legacy-task-reference-card.factory';

// TODO: consider having a single factory that needs a type passed.
export const legacyTaskReferenceCardSkeletonFactory = BaseFactory.define<CardSkeleton, CardSkeletonProps>(
	CardSkeleton,
	() => {
		return {
			height: 208,
			card: legacyTaskReferenceCardFactory.build(),
		};
	}
);
