export class BoardLessonDto {
	id: string;

	name: string;

	courseName?: string;

	numberOfPublishedTasks: number;

	numberOfDraftTasks?: number;

	numberOfPlannedTasks?: number;

	createdAt: string;

	updatedAt: string;

	hidden: boolean;

	constructor(props: BoardLessonDto) {
		this.id = props.id;
		this.name = props.name;
		this.hidden = props.hidden;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.numberOfPublishedTasks = props.numberOfPublishedTasks;
		this.numberOfDraftTasks = props.numberOfDraftTasks;
		this.numberOfPlannedTasks = props.numberOfPlannedTasks;
	}
}
