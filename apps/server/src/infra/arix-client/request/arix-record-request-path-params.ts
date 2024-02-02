import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ArixRecordRequestPathParams {
	@IsString()
	@ApiProperty({
		description: 'The identifier of the record',
		default: 'XMEDIENLB-5552796',
	})
	identifier!: string;
}
