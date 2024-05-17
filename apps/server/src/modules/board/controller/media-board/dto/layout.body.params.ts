import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MediaBoardLayoutType } from '../../../domain';

export class LayoutBodyParams {
	@IsEnum(MediaBoardLayoutType)
	@ApiProperty({ enum: MediaBoardLayoutType, enumName: 'MediaBoardLayoutType' })
	layout!: MediaBoardLayoutType;
}
