import { ColumnSkeletonDto } from './column-skeleton.dto';

export class BoardSkeletonDto {
	boardId: string;

	title: string;

	columns: ColumnSkeletonDto[];

	isVisible: boolean;

	layout: string;

	constructor(props: BoardSkeletonDto) {
		this.boardId = props.boardId;
		this.title = props.title;
		this.columns = props.columns;
		this.isVisible = props.isVisible;
		this.layout = props.layout;
	}
}
