import { CardSkeletonDto } from './card-skeleton.dto';

export class ColumnSkeletonDto {
	columnId: string;

	title: string;

	cards: CardSkeletonDto[];

	constructor(props: ColumnSkeletonDto) {
		this.columnId = props.columnId;
		this.title = props.title;
		this.cards = props.cards;
	}
}
