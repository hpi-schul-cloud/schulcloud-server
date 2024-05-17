import { IsMongoId } from 'class-validator';

export class DeleteCardMessageParams {
	@IsMongoId()
	cardId!: string;
}
