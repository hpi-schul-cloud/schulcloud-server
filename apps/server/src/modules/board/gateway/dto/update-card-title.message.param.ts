import { IsMongoId, IsString } from 'class-validator';

export class UpdateCardTitleMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsString()
	newTitle!: string;
}
