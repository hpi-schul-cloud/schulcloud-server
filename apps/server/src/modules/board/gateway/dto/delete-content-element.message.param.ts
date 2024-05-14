import { IsMongoId } from 'class-validator';

export class DeleteContentElementMessageParams {
	@IsMongoId()
	elementId!: string;
}
