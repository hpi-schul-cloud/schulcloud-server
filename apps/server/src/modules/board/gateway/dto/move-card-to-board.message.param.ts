import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';

export class MoveCardToBoardMessageParams {
	@IsMongoId()
	cardId!: string;

	@IsMongoId()
	fromColumnId!: string;

	@IsMongoId()
	toColumnId!: string;

	@IsOptional()
	@IsBoolean()
	forceNextTick?: boolean;
}
