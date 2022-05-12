export type CopyStatusDTO = {
	title: string;
	type: CopyElementType;
	status: CopyStatusEnum;
	elements?: CopyStatusDTO[];
};

export enum CopyElementType {
	'TASK' = 'task',
	'FILE' = 'file',
	'LEAF' = 'leaf',
}

export enum CopyStatusEnum {
	'SUCCESS' = 'success',
	'FAIL' = 'failure', // but tried
	'NOT_DOING' = 'not-doing', // for functional reasons
	'NOT_IMPLEMENTED' = 'not-implemented', // might be implemented in the future
}
