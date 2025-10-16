import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BoardLayout } from '../../../domain';

export class LayoutBodyParams {
	@IsEnum(BoardLayout)
	@ApiProperty({ enum: BoardLayout, enumName: 'BoardLayout' })
	public layout!: BoardLayout;
}
