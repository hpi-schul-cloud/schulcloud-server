import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class MaintenanceParams {
	@IsBoolean()
	@ApiProperty()
	public maintenance!: boolean;
}
