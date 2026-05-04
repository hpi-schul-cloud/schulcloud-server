import { IsMongoId } from 'class-validator';

export class CopyColumnMessageParams {
	@IsMongoId()
	columnId!: string;
}
