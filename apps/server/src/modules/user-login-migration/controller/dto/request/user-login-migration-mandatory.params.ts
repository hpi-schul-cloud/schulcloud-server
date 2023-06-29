import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UserLoginMigrationMandatoryParams {
	@IsBoolean()
	@ApiProperty()
	mandatory!: boolean;
}
