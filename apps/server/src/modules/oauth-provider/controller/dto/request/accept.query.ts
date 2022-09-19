import { IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller/index';

export class AcceptQuery {
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({ description: 'Accepts the login request.', required: true, nullable: false })
	accept!: boolean;
}
