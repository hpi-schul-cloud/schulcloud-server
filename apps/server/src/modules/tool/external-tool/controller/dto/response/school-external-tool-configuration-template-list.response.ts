import { ApiProperty } from '@nestjs/swagger';
import { SchoolExternalToolConfigurationTemplateResponse } from './school-external-tool-configuration-template.response';

export class SchoolExternalToolConfigurationTemplateListResponse {
	@ApiProperty({ type: [SchoolExternalToolConfigurationTemplateResponse] })
	data: SchoolExternalToolConfigurationTemplateResponse[];

	constructor(data: SchoolExternalToolConfigurationTemplateResponse[]) {
		this.data = data;
	}
}
