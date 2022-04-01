import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsNumber, Min, IsOptional } from 'class-validator';

/**
 * DTO for Updating the position of a Dashboard Element.
 */

export class MoveElementPositionParams {
	@IsNumber()
	@Min(0)
	@ApiProperty()
	x!: number;

	@IsNumber()
	@Min(0)
	@ApiProperty()
	y!: number;

	@IsNumber()
	@Min(0)
	@IsOptional()
	@ApiPropertyOptional({ description: 'used to identify a position within a group.' })
	groupIndex?: number;
}

export class MoveElementParams {
	@ValidateNested()
	@ApiProperty()
	from!: MoveElementPositionParams;

	@ValidateNested()
	@ApiProperty()
	to!: MoveElementPositionParams;
}
