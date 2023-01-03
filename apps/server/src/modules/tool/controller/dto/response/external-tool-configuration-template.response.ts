import { EntityId } from '@shared/domain';
import { ApiProperty } from '@nestjs/swagger';
import { CustomParameterResponse } from './custom-parameter.response';

export class ExternalToolConfigurationTemplateResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name?: string;

	@ApiProperty()
	logoUrl?: string;

	@ApiProperty()
	parameters: CustomParameterResponse[];

	@ApiProperty()
	version: number;

	constructor(configuration: ExternalToolConfigurationTemplateResponse) {
		this.id = configuration.id;
		this.name = configuration.name;
		this.logoUrl = configuration.logoUrl;
		this.parameters = configuration.parameters;
		this.version = configuration.version;
	}
}
