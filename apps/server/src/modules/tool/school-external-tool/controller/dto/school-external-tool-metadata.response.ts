import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolCountPerContextResponse } from '../../../common/controller/dto';

export class SchoolExternalToolMetadataResponse {
	@ApiProperty()
	contextExternalToolCountPerContext: ContextExternalToolCountPerContextResponse;

	constructor(schoolExternalToolMetadataResponse: SchoolExternalToolMetadataResponse) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadataResponse.contextExternalToolCountPerContext;
	}
}
