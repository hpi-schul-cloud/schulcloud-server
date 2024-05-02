import { IsMongoId } from 'class-validator';

export class CreateCardMessageParams {
	@IsMongoId()
	columnId!: string;
}
