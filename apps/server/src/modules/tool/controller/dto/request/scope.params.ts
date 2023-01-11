import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ConfigurationScope } from '../../../interface';

export class ScopeParams {
	@IsEnum(ConfigurationScope)
	@ApiProperty({ nullable: false, required: true })
	scope!: ConfigurationScope;
}
