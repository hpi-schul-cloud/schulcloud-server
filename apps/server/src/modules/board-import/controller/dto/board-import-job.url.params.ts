import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class BoardImportJobUrlParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the import job.', required: true, nullable: false })
	jobId!: string;
}
