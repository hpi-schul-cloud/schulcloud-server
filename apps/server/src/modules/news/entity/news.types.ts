import { EntityId } from '@shared/domain';
import { CourseInfo } from './course-info.entity';
import { SchoolInfo } from './school-info.entity';
import { TeamInfo } from './team-info.entity';

export enum NewsTargetModel {
	School = 'schools',
	Course = 'courses',
	Team = 'teams',
}

/** news interface for ceating news */
export interface ICreateNews {
	title: string;
	content: string;
	displayAt?: Date;
	target: { targetModel: NewsTargetModel; targetId: EntityId };
}

/** news interface for updating news */
export type IUpdateNews = Partial<ICreateNews>;

/** interface for finding news with optional targetId */
export interface INewsScope {
	target?: { targetModel: NewsTargetModel; targetId?: EntityId };
	unpublished?: boolean;
}

export type NewsTargetInfo = SchoolInfo | TeamInfo | CourseInfo;
