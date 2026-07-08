import { IsEnum, IsMongoId } from 'class-validator';
import { Colors } from '../../domain';

export class UpdateCardColorMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsEnum(Colors)
	backgroundColor!: Colors;
}
