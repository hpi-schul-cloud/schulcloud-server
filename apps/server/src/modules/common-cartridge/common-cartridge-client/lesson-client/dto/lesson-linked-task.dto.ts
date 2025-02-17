import { LessonLinkedTaskResponse } from '../lessons-api-client';

export class LessonLinkedTaskDto {
	name: string;

	description: string;

	descriptionInputFormat: LessonLinkedTaskDescriptionInputFormatType;

	availableDate: string | null;

	dueDate: string | null;

	private: boolean;

	publicSubmissions: boolean | null;

	teamSubmissions: boolean | null;

	creator: string | null;

	courseId: string | null;

	submissionIds: string[];

	finishedIds: string[];

	constructor(props: LessonLinkedTaskResponse) {
		this.name = props.name;
		this.description = props.description;
		this.descriptionInputFormat = props.descriptionInputFormat;
		this.availableDate = props.availableDate;
		this.dueDate = props.dueDate;
		this.private = props.private;
		this.creator = props.creator;
		this.courseId = props.courseId;
		this.publicSubmissions = props.publicSubmissions;
		this.teamSubmissions = props.teamSubmissions;
		this.submissionIds = props.submissionIds;
		this.finishedIds = props.finishedIds;
	}
}

export const LessonLinkedTaskDescriptionInputFormat = {
	PLAIN_TEXT: 'plainText',
	RICH_TEXT_CK5_SIMPLE: 'richTextCk5Simple',
	RICH_TEXT_CK4: 'richTextCk4',
	RICH_TEXT_CK5: 'richTextCk5',
} as const;

export type LessonLinkedTaskDescriptionInputFormatType =
	typeof LessonLinkedTaskDescriptionInputFormat[keyof typeof LessonLinkedTaskDescriptionInputFormat];
