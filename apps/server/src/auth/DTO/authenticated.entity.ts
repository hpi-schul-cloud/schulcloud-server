import { ApiProperty } from '@nestjs/swagger';

export class IsAuthenticated {
	@ApiProperty()
	access_token: string;
}
