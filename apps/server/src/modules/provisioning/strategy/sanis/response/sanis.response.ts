import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsObject, IsString, ValidateNested } from 'class-validator';
import { SanisPersonResponse } from './sanis-person-response';
import { SanisPersonenkontextResponse } from './sanis-personenkontext-response';
import { SanisResponseValidationGroups } from './sanis-response-validation-groups';

export class SanisResponse {
	@IsString({ groups: [SanisResponseValidationGroups.USER] })
	pid!: string;

	@IsObject()
	@ValidateNested({ groups: [SanisResponseValidationGroups.USER] })
	@Type(() => SanisPersonResponse)
	person!: SanisPersonResponse;

	@IsArray()
	@IsObject({ each: true })
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => SanisPersonenkontextResponse)
	personenkontexte!: SanisPersonenkontextResponse[];
}
