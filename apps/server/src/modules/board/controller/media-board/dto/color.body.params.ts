import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MediaBoardColors } from '../../../domain';

export class ColorBodyParams {
	@IsEnum(MediaBoardColors)
	@ApiProperty({ enum: MediaBoardColors, enumName: 'MediaBoardColors' })
	backgroundColor!: MediaBoardColors;
}
