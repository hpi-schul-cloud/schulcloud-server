import { ApiProperty } from '@nestjs/swagger';
import { MediaBoardColors } from '../types/media-colors.enum';

export class ColorBodyParams {
	@ApiProperty({ enum: MediaBoardColors, enumName: 'MediaBoardColors' })
	backgroundColor!: MediaBoardColors;
}
