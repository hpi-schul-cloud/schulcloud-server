import { IsEnum, IsMongoId } from 'class-validator';
import { BoardLayout } from '../../domain';

export class UpdateBoardLayoutMessageParams {
	@IsMongoId()
	boardId!: string;

	@IsEnum(BoardLayout)
	layout!: BoardLayout;
}
