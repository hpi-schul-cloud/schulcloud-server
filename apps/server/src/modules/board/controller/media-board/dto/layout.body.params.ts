import { ApiProperty } from '@nestjs/swagger';
import { MediaBoardLayoutType } from '../types/layout-type.enum';

export class LayoutBodyParams {
	@ApiProperty({ enum: MediaBoardLayoutType })
	type!: MediaBoardLayoutType;
}
