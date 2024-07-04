import { IsBoolean, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';

export class MoveCardMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsMongoId()
	fromColumnId!: string;

	@IsMongoId()
	toColumnId!: string;

	@IsNumber()
	@Min(0)
	newIndex!: number;

	@IsNumber()
	@Min(0)
	oldIndex!: number;

	@IsNumber()
	@Min(0)
	fromColumnIndex!: number;

	@IsNumber()
	@Min(0)
	toColumnIndex!: number;

	@IsOptional()
	@IsBoolean()
	forceNextTick?: boolean;
}
