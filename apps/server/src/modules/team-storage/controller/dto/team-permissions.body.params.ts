import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class TeamPermissions {
	@IsBoolean()
	@ApiProperty()
	read!: boolean;

	@IsBoolean()
	@ApiProperty()
	write!: boolean;

	@IsBoolean()
	@ApiProperty()
	create!: boolean;

	@IsBoolean()
	@ApiProperty()
	delete!: boolean;

	@IsBoolean()
	@ApiProperty()
	share!: boolean;
}
