import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveCardMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsMongoId()
	fromColumnId!: string;

	@IsMongoId()
	toColumnId!: string;

	@IsNumber()
	@Min(0)
	newIndex!: number;

	@IsNumber()
	@Min(0)
	oldIndex!: number;
}
