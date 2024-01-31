import { ApiProperty } from '@nestjs/swagger';
import { ArixLogo } from '../type/arix-logo';

export class ArixLogoResponse {
	@ApiProperty({ description: 'A arix logo' })
	logo!: ArixLogo;
}
