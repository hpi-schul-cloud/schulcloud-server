import { IsEnum, IsMongoId } from 'class-validator';
import { BoardLayout } from '../../domain';

export class UpdateBoardLayoutMessageParams {
	@IsMongoId()
	public boardId!: string;

	@IsEnum(BoardLayout)
	public layout!: BoardLayout;
}
