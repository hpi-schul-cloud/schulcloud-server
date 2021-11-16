import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsNumber, Min, IsOptional } from 'class-validator';

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */

export class MoveElementPosition {
	constructor({ x, y, groupIndex }: MoveElementPosition) {
		this.x = x;
		this.y = y;
		this.groupIndex = groupIndex;
	}

	@IsNumber()
	@Min(0)
	@ApiProperty()
	x: number;

	@IsNumber()
	@Min(0)
	@ApiProperty()
	y: number;

	@IsNumber()
	@Min(0)
	@IsOptional()
	@ApiPropertyOptional({ description: 'used to identify a position within a group.' })
	groupIndex?: number;
}

export class MoveElementParams {
	constructor({ from, to }: MoveElementParams) {
		this.from = from;
		this.to = to;
	}

	@ValidateNested()
	@ApiProperty()
	from: MoveElementPosition;

	@ValidateNested()
	@ApiProperty()
	to: MoveElementPosition;
}
