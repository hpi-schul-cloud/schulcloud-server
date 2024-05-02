import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveCardMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsMongoId()
	toColumnId!: string;

	@IsNumber()
	@Min(0)
	newIndex!: number;
}
