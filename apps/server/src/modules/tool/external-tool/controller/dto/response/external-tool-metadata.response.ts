import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolCountPerContextResponse } from '../../../../common/controller/dto';

export class ExternalToolMetadataResponse {
	@ApiProperty()
	schoolExternalToolCount: number;

	@ApiProperty()
	contextExternalToolCountPerContext: ContextExternalToolCountPerContextResponse;

	constructor(externalToolMetadataResponse: ExternalToolMetadataResponse) {
		this.schoolExternalToolCount = externalToolMetadataResponse.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolMetadataResponse.contextExternalToolCountPerContext;
	}
}
