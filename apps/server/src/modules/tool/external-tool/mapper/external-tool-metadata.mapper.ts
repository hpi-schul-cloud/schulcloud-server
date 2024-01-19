import { ContextExternalToolCountPerContextResponse } from '../../common/controller/dto';
import { ExternalToolMetadataResponse } from '../controller/dto';
import { ExternalToolMetadata } from '../domain';

export class ExternalToolMetadataMapper {
	static mapToExternalToolMetadataResponse(externalToolMetadata: ExternalToolMetadata): ExternalToolMetadataResponse {
		const externalToolMetadataResponse: ExternalToolMetadataResponse = new ExternalToolMetadataResponse({
			schoolExternalToolCount: externalToolMetadata.schoolExternalToolCount,
			contextExternalToolCountPerContext: new ContextExternalToolCountPerContextResponse(
				externalToolMetadata.contextExternalToolCountPerContext
			),
		});

		return externalToolMetadataResponse;
	}
}
