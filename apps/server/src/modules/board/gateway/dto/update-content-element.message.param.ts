import { IsMongoId } from 'class-validator';
import { UpdateElementContentBodyParams } from '../../controller/dto';

export class UpdateContentElementMessageParams extends UpdateElementContentBodyParams {
	@IsMongoId()
	elementId!: string;
}
