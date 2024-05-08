import { IsInt, IsMongoId, IsNumber, Min } from 'class-validator';

export class UpdateCardHeightMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsNumber()
	@IsInt()
	@Min(10)
	newHeight!: number;
}
