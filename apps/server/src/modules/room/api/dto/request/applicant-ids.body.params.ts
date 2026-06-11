import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class ApplicantIdsBodyParams {
	@ApiProperty({
		description: 'The IDs of the applicants',
		required: true,
	})
	@IsArray()
	@IsMongoId({ each: true })
	public userIds!: string[];
}
