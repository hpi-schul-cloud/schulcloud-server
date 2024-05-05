import { IsMongoId } from 'class-validator';

export class CreateColumnMessageParams {
	@IsMongoId()
	boardId!: string;
}
