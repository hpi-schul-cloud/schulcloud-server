import { EntityId } from '@shared/domain';

export const NewsTargetModel = {
	School: 'schools',
	Course: 'courses',
	Team: 'teams',
} as const;

// TODO put into shared types
type ValueOf<T> = T[keyof T];

export type NewsTargetModelValue = ValueOf<typeof NewsTargetModel>;

/** define the news target for a specific entity  */
export type NewsTarget = { targetModel: NewsTargetModelValue; targetId: EntityId };

/** define the news target for find */
export type FindNewsTarget = { targetModel: NewsTargetModelValue; targetId?: EntityId };

/** news interface for ceating news */
export interface ICreateNews {
	title: string;
	content: string;
	displayAt: Date;
	target: NewsTarget;
}

/** news interface for updating news */
export type IUpdateNews = Partial<ICreateNews>;

/** news interface for finding news */
export interface INewsScope {
	target?: FindNewsTarget;
	unpublished?: boolean;
}
