import { IsEnum, IsMongoId, } from 'class-validator';
import { Colors } from '../../domain';

export class UpdateCardColorMessageParams {
	@IsMongoId()
	public cardId!: string;

	@IsEnum(Colors)
	public backgroundColor!: Colors;
}
