import { IsBoolean, IsMongoId } from 'class-validator';

export class UpdateBoardVisibilityMessageParams {
	@IsMongoId()
	boardId!: string;

	@IsBoolean()
	isVisible!: boolean;
}
