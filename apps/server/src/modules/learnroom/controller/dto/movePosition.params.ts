import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsNumber, IsPositive } from 'class-validator';

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */

export class MoveElementPosition {
	@IsNumber()
	@IsPositive()
	x: number;

	@IsNumber()
	@IsPositive()
	y: number;
}

export class MoveElementParams {
	@ValidateNested()
	@ApiProperty()
	from: MoveElementPosition;

	@ValidateNested()
	@ApiProperty()
	to: MoveElementPosition;
}
