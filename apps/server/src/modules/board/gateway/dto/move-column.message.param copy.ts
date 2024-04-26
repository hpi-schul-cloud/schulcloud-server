import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveColumnMessageParams {
	@IsMongoId()
	columnId!: string;

	@IsMongoId()
	targetBoardId!: string;

	@IsNumber()
	@Min(0)
	newIndex!: number;
}
