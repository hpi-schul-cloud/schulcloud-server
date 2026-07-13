import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class CommonCartridgeFileParams {
	@ApiProperty({ type: 'string', format: 'binary' })
	@Allow()
	file!: string;
}
