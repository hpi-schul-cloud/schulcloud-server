import { AuthorizableObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export type CopyStatus = {
	id?: string;
	title?: string;
	type: CopyElementType;
	status: CopyStatusEnum;
	elements?: CopyStatus[];
	copyEntity?: AuthorizableObject;
	originalEntity?: AuthorizableObject;
};

export enum CopyElementType {
	BOARD = 'BOARD',
	CARD = 'CARD',
	COLUMN = 'COLUMN',
	COLUMNBOARD = 'COLUMNBOARD',
	CONTENT = 'CONTENT',
	COURSE = 'COURSE',
	COURSEGROUP_GROUP = 'COURSEGROUP_GROUP',
	EXTERNAL_TOOL = 'EXTERNAL_TOOL',
	EXTERNAL_TOOL_ELEMENT = 'EXTERNAL_TOOL_ELEMENT',
	FILE = 'FILE',
	FILE_ELEMENT = 'FILE_ELEMENT',
	DRAWING_ELEMENT = 'DRAWING_ELEMENT',
	FILE_GROUP = 'FILE_GROUP',
	LEAF = 'LEAF',
	LESSON = 'LESSON',
	LESSON_CONTENT_ETHERPAD = 'LESSON_CONTENT_ETHERPAD',
	LESSON_CONTENT_GEOGEBRA = 'LESSON_CONTENT_GEOGEBRA',
	LESSON_CONTENT_GROUP = 'LESSON_CONTENT_GROUP',
	LESSON_CONTENT_LERNSTORE = 'LESSON_CONTENT_LERNSTORE',
	LESSON_CONTENT_NEXBOARD = 'LESSON_CONTENT_NEXBOARD',
	LESSON_CONTENT_TASK = 'LESSON_CONTENT_TASK',
	LESSON_CONTENT_TEXT = 'LESSON_CONTENT_TEXT',
	LERNSTORE_MATERIAL = 'LERNSTORE_MATERIAL',
	LERNSTORE_MATERIAL_GROUP = 'LERNSTORE_MATERIAL_GROUP',
	LINK_ELEMENT = 'LINK_ELEMENT',
	LTITOOL_GROUP = 'LTITOOL_GROUP',
	METADATA = 'METADATA',
	RICHTEXT_ELEMENT = 'RICHTEXT_ELEMENT',
	SUBMISSION_CONTAINER_ELEMENT = 'SUBMISSION_CONTAINER_ELEMENT',
	SUBMISSION_ITEM = 'SUBMISSION_ITEM',
	SUBMISSION_GROUP = 'SUBMISSION_GROUP',
	TASK = 'TASK',
	TASK_GROUP = 'TASK_GROUP',
	TIME_GROUP = 'TIME_GROUP',
	USER_GROUP = 'USER_GROUP',
}

export enum CopyStatusEnum {
	'SUCCESS' = 'success',
	'FAIL' = 'failure', // but tried
	'NOT_DOING' = 'not-doing', // for functional reasons
	'NOT_IMPLEMENTED' = 'not-implemented', // might be implemented in the future
	'PARTIAL' = 'partial', // parent is partial successful
}

export type CopyDictionary = Map<EntityId, AuthorizableObject>;
