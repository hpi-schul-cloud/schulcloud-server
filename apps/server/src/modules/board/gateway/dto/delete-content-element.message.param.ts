import { IsMongoId } from 'class-validator';

export class DeleteContentElementMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsMongoId()
	elementId!: string;
}
