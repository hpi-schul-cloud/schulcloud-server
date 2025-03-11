import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolCountPerContextResponse } from '../../../../common/controller/dto';

export class ExternalToolMetadataResponse {
	@ApiProperty({ description: 'Amount of usages of the tool in schools' })
	public schoolExternalToolCount: number;

	@ApiProperty({ description: 'Amount of usages of the tool in contexts' })
	public contextExternalToolCountPerContext: ContextExternalToolCountPerContextResponse;

	constructor(externalToolMetadataResponse: ExternalToolMetadataResponse) {
		this.schoolExternalToolCount = externalToolMetadataResponse.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolMetadataResponse.contextExternalToolCountPerContext;
	}
}
