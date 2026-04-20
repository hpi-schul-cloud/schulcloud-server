import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Colors } from '../../domain/types';

export class ColorBodyParams {
	@IsEnum(Colors)
	@ApiProperty({ enum: Colors, enumName: 'Colors' })
	public backgroundColor!: Colors;
}
