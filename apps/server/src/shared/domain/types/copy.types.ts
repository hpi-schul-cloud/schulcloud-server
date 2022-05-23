import { BaseEntity } from '../entity/base.entity';

export type CopyStatusDTO = {
	id?: string;
	title: string;
	type: CopyElementType;
	status: CopyStatusEnum;
	elements?: CopyStatusDTO[];
	copyEntity?: BaseEntity;
};

export enum CopyElementType {
	'TASK' = 'task',
	'COURSE' = 'course',
	'FILE' = 'file',
	'LEAF' = 'leaf',
}

export enum CopyStatusEnum {
	'SUCCESS' = 'success',
	'FAIL' = 'failure', // but tried
	'NOT_DOING' = 'not-doing', // for functional reasons
	'NOT_IMPLEMENTED' = 'not-implemented', // might be implemented in the future
	'PARTIAL' = 'partial', // parent is partial successful
}
