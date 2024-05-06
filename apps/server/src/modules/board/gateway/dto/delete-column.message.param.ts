import { IsMongoId } from 'class-validator';

export class DeleteColumnMessageParams {
	@IsMongoId()
	columnId!: string;
}
