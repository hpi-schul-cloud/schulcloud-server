import { ExternalToolMetadataResponse } from '../controller/dto/response/external-tool-metadata.response';
import { ExternalToolMetadata } from '../domain/external-tool-metadata';

export class ExternalToolMetadataMapper {
	static mapToExternalToolMetadataResponse(externalToolMetadata: ExternalToolMetadata): ExternalToolMetadataResponse {
		const externalToolMetadataResponse: ExternalToolMetadataResponse = new ExternalToolMetadataResponse({
			schoolExternalToolCount: externalToolMetadata.schoolExternalToolCount,
			contextExternalToolCountPerContext: externalToolMetadata.contextExternalToolCountPerContext,
		});

		return externalToolMetadataResponse;
	}
}
