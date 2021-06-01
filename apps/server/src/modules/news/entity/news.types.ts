import { EntityId } from '@shared/domain';

export const NewsTargetModel = {
	Course: 'courses',
	Team: 'teams',
} as const;

// TODO put into shared types
type ValueOf<T> = T[keyof T];

export type NewsTargetModelValue = ValueOf<typeof NewsTargetModel>;

export type NewsTarget =
	| {
			targetModel: 'school';
	  }
	| { targetModel: NewsTargetModelValue; targetId: EntityId };

export type FindNewsTarget =
	| {
			targetModel: 'school';
	  }
	| { targetModel: NewsTargetModelValue; targetId?: EntityId };

export interface ICreateNews {
	title: string;
	content: string;
	displayAt: Date;
	target: NewsTarget;
}

export type IUpdateNews = Partial<ICreateNews>;
export interface INewsScope {
	// TODO clarify on singular vs plural: e.g. 'courses' vs 'school'
	// do not use the collection name!
	// we should use the entity instead here (which is then mapped to the collection)
	// see News entity definition
	target?: FindNewsTarget;
	unpublished?: boolean;
}
