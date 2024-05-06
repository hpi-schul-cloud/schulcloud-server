import { IsMongoId, IsString } from 'class-validator';

export class UpdateBoardTitleMessageParams {
	@IsMongoId()
	boardId!: string;

	@IsString()
	newTitle!: string;
}
