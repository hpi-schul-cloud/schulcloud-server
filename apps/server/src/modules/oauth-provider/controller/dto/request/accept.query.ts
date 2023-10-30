import { ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller/transformer/string-to-boolean.transformer';
import { IsBoolean } from 'class-validator';

export class AcceptQuery {
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({ description: 'Accepts the login request.', required: true, nullable: false })
	accept!: boolean;
}
