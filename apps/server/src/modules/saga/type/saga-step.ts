import { EntityId } from '@shared/domain/types';
import { StepReport } from './report';

export interface StepType {
	deleteUserData: { params: { userId: EntityId }; result: StepReport };
	// add more, e.g.:
	// deleteUserReference: { params: { userId: EntityId }; result: boolean };
	// step1: { params: { value: number }; result: string };
	// step2: { params: { message: string }; result: boolean };
}

export enum ModuleName {
	ACCOUNT = 'account',
	BOARD = 'board',
	CLASS = 'class',
	COURSE = 'course',
	COURSE_COURSEGROUP = 'courseGroup',
	LEARNROOM_DASHBOARD = 'dashboard',
	FILES = 'file',
	FILES_STORAGE = 'fileRecords',
	LESSON = 'lessons',
	PSEUDONYM = 'pseudonyms',
	ROCKETCHATUSER = 'rocketChatUser',
	TASK = 'task',
	TASK_SUBMISSION = 'submissions',
	TEAM = 'teams',
	USER = 'user',
	USER_CALENDAR = 'calendar',
	USER_REGISTRATIONPIN = 'registrationPin',
	NEWS = 'news',
}

export abstract class SagaStep<T extends keyof StepType> {
	constructor(public readonly name: T) {}

	public abstract execute(params: StepType[T]['params']): Promise<StepType[T]['result']>;
	// public abstract compensate(params: StepType[T]['params']): Promise<void>;
}
