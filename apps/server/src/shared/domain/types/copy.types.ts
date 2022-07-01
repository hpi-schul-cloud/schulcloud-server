import { BaseEntity } from '../entity/base.entity';

export type CopyStatus = {
	id?: string;
	title: string;
	type: CopyElementType;
	status: CopyStatusEnum;
	elements?: CopyStatus[];
	copyEntity?: BaseEntity;
};

export enum CopyElementType {
	'BOARD' = 'board',
	'COURSE' = 'course',
	'FILE' = 'file',
	'LEAF' = 'leaf',
	'LESSON' = 'lesson',
	'TASK' = 'task',
	'LESSON_CONTENT' = 'lesson-content',
	'LESSON_CONTENT_GROUP' = 'lesson-content-group',
}

export enum CopyStatusEnum {
	'SUCCESS' = 'success',
	'FAIL' = 'failure', // but tried
	'NOT_DOING' = 'not-doing', // for functional reasons
	'NOT_IMPLEMENTED' = 'not-implemented', // might be implemented in the future
	'PARTIAL' = 'partial', // parent is partial successful
}
