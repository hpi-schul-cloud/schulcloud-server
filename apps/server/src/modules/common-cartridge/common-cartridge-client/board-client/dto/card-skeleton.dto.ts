export class CardSkeletonDto {
	cardId: string;

	height: number;

	constructor(props: CardSkeletonDto) {
		this.cardId = props.cardId;
		this.height = props.height;
	}
}
