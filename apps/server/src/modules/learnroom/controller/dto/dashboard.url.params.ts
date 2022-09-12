import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class DashboardUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the dashboard.',
		required: true,
		nullable: false,
	})
	dashboardId!: string;
}
