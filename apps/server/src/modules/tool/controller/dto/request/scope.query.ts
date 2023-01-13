import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConfigurationScope } from '../../../interface';

export class ScopeQuery {
	@IsEnum(ConfigurationScope)
	@ApiProperty({ nullable: false, required: true })
	scope!: ConfigurationScope;
}
