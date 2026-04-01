import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Colors } from '../../../domain/media-board/types';

export class ColorBodyParams {
	@IsEnum(Colors)
	@ApiProperty({ enum: Colors, enumName: 'MediaBoardColors' })
	backgroundColor!: Colors;
}
