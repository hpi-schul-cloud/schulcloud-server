import { BoardLayout } from '../enums/board-layout.enum';

export class BoardColumnBoardDto {
	id: string;

	title: string;

	published: boolean;

	createdAt: string;

	updatedAt: string;

	columnBoardId: string;

	layout: BoardLayout;

	constructor(props: BoardColumnBoardDto) {
		this.id = props.id;
		this.title = props.title;
		this.published = props.published;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.columnBoardId = props.columnBoardId;
		this.layout = props.layout;
	}
}
