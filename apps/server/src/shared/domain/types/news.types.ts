import type { CourseEntity } from '@modules/course/repo';
import { SchoolEntity } from '@modules/school/repo';
import type { TeamEntity } from '../entity/team.entity';
import { EntityId } from './entity-id';

export enum NewsTargetModel {
	'School' = 'schools',
	'Course' = 'courses',
	'Team' = 'teams',
}

/** news interface for ceating news */
export interface CreateNews {
	title: string;
	content: string;
	displayAt?: Date;
	target: { targetModel: NewsTargetModel; targetId: EntityId };
}

/** news interface for updating news */
export type IUpdateNews = Partial<CreateNews>;

/** interface for finding news with optional targetId */
export interface INewsScope {
	target?: { targetModel: NewsTargetModel; targetId?: EntityId };
	unpublished?: boolean;
}

export type NewsTarget = SchoolEntity | TeamEntity | CourseEntity;
