import { IsInt, IsMongoId, IsNumber, Min } from 'class-validator';
import { Colors } from '../../domain';

export class UpdateCardColorMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsNumber()
	@IsInt()
	@Min(10)
	backgroundColor!: Colors;
}
