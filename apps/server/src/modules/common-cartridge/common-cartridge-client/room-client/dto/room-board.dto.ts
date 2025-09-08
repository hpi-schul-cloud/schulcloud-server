import { BoardElementDto } from './board-element.dto';

export class RoomBoardDto {
	roomId: string;

	title: string;

	displayColor: string;

	elements: Array<BoardElementDto>;

	isArchived: boolean;

	isSynchronized: boolean;

	constructor(props: RoomBoardDto) {
		this.roomId = props.roomId;
		this.title = props.title;
		this.displayColor = props.displayColor;
		this.elements = props.elements;
		this.isArchived = props.isArchived;
		this.isSynchronized = props.isSynchronized;
	}
}
