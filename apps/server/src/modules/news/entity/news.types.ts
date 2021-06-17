import { EntityId } from '@shared/domain';

export enum NewsTargetModel {
	School = 'schools',
	Course = 'courses',
	Team = 'teams',
}

/** define the news target for a specific entity  */
export type NewsTarget = { targetModel: NewsTargetModel; targetId: EntityId };

/** define the news target for find */
export type FindNewsTarget = { targetModel: NewsTargetModel; targetId?: EntityId };

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
