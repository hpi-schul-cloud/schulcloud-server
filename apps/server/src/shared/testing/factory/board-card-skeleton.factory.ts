import { CardSkeleton, CardSkeletonProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

export const cardSkeletonFactory = BaseFactory.define<CardSkeleton, CardSkeletonProps>(CardSkeleton, () => {
	return {
		height: 208,
		cardId: new ObjectId(),
	};
});
