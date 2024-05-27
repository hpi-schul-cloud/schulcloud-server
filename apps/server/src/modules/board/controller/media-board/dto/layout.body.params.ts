import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BoardLayout } from '../../../domain/types';

export class LayoutBodyParams {
	@IsEnum(BoardLayout)
	@ApiProperty({ enum: BoardLayout, enumName: 'BoardLayout' })
	layout!: BoardLayout;
}
