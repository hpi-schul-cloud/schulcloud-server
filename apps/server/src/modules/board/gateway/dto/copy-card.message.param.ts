import { IsMongoId } from 'class-validator';

export class CopyCardMessageParams {
	@IsMongoId()
	cardId!: string;
}
