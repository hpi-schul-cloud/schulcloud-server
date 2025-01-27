import { CardSkeletonDto } from './card-skeleton.dto';

export class ColumnSkeletonDto {
	public columnId: string;

	public title: string;

	public cards: CardSkeletonDto[];

	constructor(props: ColumnSkeletonDto) {
		this.columnId = props.columnId;
		this.title = props.title;
		this.cards = props.cards;
	}
}
