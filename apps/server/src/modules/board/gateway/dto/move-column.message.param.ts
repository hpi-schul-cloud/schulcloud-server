import { IsMongoId, IsNumber, IsString, Min, ValidateNested } from 'class-validator';

export class ColumnMove {
	@IsNumber()
	addedIndex!: number;

	@IsNumber()
	removedIndex?: number | null;

	@IsString()
	columnId!: string;
}

export class MoveColumnMessageParams {
	@IsMongoId()
	columnId!: string;

	@IsMongoId()
	targetBoardId!: string;

	@IsNumber()
	@Min(0)
	newIndex!: number;

	@ValidateNested()
	columnMove!: ColumnMove;
}
