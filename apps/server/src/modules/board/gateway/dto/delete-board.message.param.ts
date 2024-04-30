import { IsMongoId } from 'class-validator';

export class DeleteBoardMessageParams {
	@IsMongoId()
	boardId!: string;
}
