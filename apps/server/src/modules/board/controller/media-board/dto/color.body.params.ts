import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MediaBoardColors } from '../../../domain/media-board/types';

export class ColorBodyParams {
	@IsEnum(MediaBoardColors)
	@ApiProperty({ enum: MediaBoardColors, enumName: 'MediaBoardColors' })
	backgroundColor!: MediaBoardColors;
}
