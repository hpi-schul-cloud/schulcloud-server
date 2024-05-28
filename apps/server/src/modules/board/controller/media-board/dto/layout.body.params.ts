import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, NotEquals } from 'class-validator';
import { BoardLayout } from '../../../domain/types';

export class LayoutBodyParams {
	@IsEnum(BoardLayout)
	@NotEquals(BoardLayout[BoardLayout.COLUMNS])
	@ApiProperty({ enum: BoardLayout, enumName: 'BoardLayout' })
	layout!: BoardLayout;
}
