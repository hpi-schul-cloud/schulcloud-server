import { IsMongoId, IsString } from 'class-validator';

export class UpdateColumnTitleMessageParams {
	@IsMongoId()
	columnId!: string;

	@IsString()
	newTitle!: string;
}
