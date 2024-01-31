import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ArixRecordRequestPathParams {
	@IsString()
	@ApiProperty({
		description: 'The identifier of the record',
		default: 'sodix-SODIX_0001019990',
	})
	identifier!: string;
}
