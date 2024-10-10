import { BoardTaskStatusDto } from './board-task-status.dto';

export class BoardTaskDto {
	id: string;

	name: string;

	availableDate?: string;

	dueDate?: string;

	courseName?: string;

	description?: string;

	displayColor?: string;

	createdAt: string;

	updatedAt: string;

	status: BoardTaskStatusDto;

	constructor(props: BoardTaskDto) {
		this.id = props.id;
		this.name = props.name;
		this.availableDate = props.availableDate;
		this.dueDate = props.dueDate;
		this.courseName = props.courseName;
		this.description = props.description;
		this.displayColor = props.displayColor;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.status = props.status;
	}
}
