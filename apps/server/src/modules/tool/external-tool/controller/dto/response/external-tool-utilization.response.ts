import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolCountPerContextResponse } from '../../../../common/controller/dto';

export class ExternalToolUtilizationResponse {
	@ApiProperty()
	public schoolExternalToolCount: number;

	@ApiProperty()
	public contextExternalToolCountPerContext: ContextExternalToolCountPerContextResponse;

	constructor(externalToolUtilizationResponse: ExternalToolUtilizationResponse) {
		this.schoolExternalToolCount = externalToolUtilizationResponse.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolUtilizationResponse.contextExternalToolCountPerContext;
	}
}
