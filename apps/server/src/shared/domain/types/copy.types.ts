import { BaseEntity } from '../entity/base.entity';

export type CopyStatus = {
	id?: string;
	title?: string;
	type: CopyElementType;
	status: CopyStatusEnum;
	elements?: CopyStatus[];
	copyEntity?: BaseEntity;
	originalEntity?: BaseEntity;
};

export enum CopyElementType {
	'BOARD' = 'BOARD',
	'CONTENT' = 'CONTENT',
	'COURSE' = 'COURSE',
	'COURSEGROUP_GROUP' = 'COURSEGROUP_GROUP',
	'FILE' = 'FILE',
	'FILE_GROUP' = 'FILE_GROUP',
	'LEAF' = 'LEAF',
	'LESSON' = 'LESSON',
	'LESSON_CONTENT_ETHERPAD' = 'LESSON_CONTENT_ETHERPAD',
	'LESSON_CONTENT_GEOGEBRA' = 'LESSON_CONTENT_GEOGEBRA',
	'LESSON_CONTENT_GROUP' = 'LESSON_CONTENT_GROUP',
	'LESSON_CONTENT_LERNSTORE' = 'LESSON_CONTENT_LERNSTORE',
	'LESSON_CONTENT_NEXBOARD' = 'LESSON_CONTENT_NEXBOARD',
	'LESSON_CONTENT_TASK' = 'LESSON_CONTENT_TASK',
	'LESSON_CONTENT_TEXT' = 'LESSON_CONTENT_TEXT',
	'LERNSTORE_MATERIAL' = 'LERNSTORE_MATERIAL',
	'LERNSTORE_MATERIAL_GROUP' = 'LERNSTORE_MATERIAL_GROUP',
	'LTITOOL_GROUP' = 'LTITOOL_GROUP',
	'METADATA' = 'METADATA',
	'SUBMISSION_GROUP' = 'SUBMISSION_GROUP',
	'TASK' = 'TASK',
	'TASK_GROUP' = 'TASK_GROUP',
	'TIME_GROUP' = 'TIME_GROUP',
	'USER_GROUP' = 'USER_GROUP',
}

export enum CopyStatusEnum {
	'SUCCESS' = 'success',
	'FAIL' = 'failure', // but tried
	'NOT_DOING' = 'not-doing', // for functional reasons
	'NOT_IMPLEMENTED' = 'not-implemented', // might be implemented in the future
	'PARTIAL' = 'partial', // parent is partial successful
}
