import { IsMongoId } from 'class-validator';

export class FetchBoardMessageParams {
	@IsMongoId()
	boardId!: string;
}
