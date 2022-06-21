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
	'TASK' = 'task',
	'LESSON' = 'lesson',
	'COURSE' = 'course',
	'BOARD' = 'board',
	'FILE' = 'file',
	'LEAF' = 'leaf',
	'LESSONMATERIAL' = 'material',
	'LESSONCONTENT' = 'lessoncontent',
}

export enum CopyStatusEnum {
	'SUCCESS' = 'success',
	'FAIL' = 'failure', // but tried
	'NOT_DOING' = 'not-doing', // for functional reasons
	'NOT_IMPLEMENTED' = 'not-implemented', // might be implemented in the future
	'PARTIAL' = 'partial', // parent is partial successful
}
