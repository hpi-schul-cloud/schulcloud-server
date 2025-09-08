export class LessonLinkedTaskDto {
	public name: string;

	public description: string;

	public descriptionInputFormat: LessonLinkedTaskDescriptionInputFormatType;

	public availableDate: string | null;

	public dueDate: string | null;

	public private: boolean;

	public publicSubmissions: boolean | null;

	public teamSubmissions: boolean | null;

	public creator: string | null;

	public courseId: string | null;

	public submissionIds: string[];

	public finishedIds: string[];

	constructor(props: LessonLinkedTaskDto) {
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
	(typeof LessonLinkedTaskDescriptionInputFormat)[keyof typeof LessonLinkedTaskDescriptionInputFormat];
