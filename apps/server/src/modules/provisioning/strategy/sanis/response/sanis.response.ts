import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { SanisPersonResponse } from './sanis-person-response';
import { SanisPersonenkontextResponse } from './sanis-personenkontext-response';
import { SanisResponseValidationGroups } from './sanis-response-validation-groups';

export class SanisResponse {
	@IsString({ groups: [SanisResponseValidationGroups.USER] })
	pid!: string;

	@ValidateNested({ groups: [SanisResponseValidationGroups.USER] })
	@Type(() => SanisPersonResponse)
	person!: SanisPersonResponse;

	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => SanisPersonenkontextResponse)
	personenkontexte!: SanisPersonenkontextResponse[];
}
