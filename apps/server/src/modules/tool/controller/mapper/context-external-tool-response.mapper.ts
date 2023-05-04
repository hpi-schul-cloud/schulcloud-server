import { ContextExternalTool } from '../../uc/dto';
import { CustomParameterEntryParam, CustomParameterEntryResponse, ContextExternalToolResponse } from '../dto';

export class ContextExternalToolResponseMapper {
	static mapContextExternalToolResponse(contextExternalTool: ContextExternalTool): ContextExternalToolResponse {
		const mapped: ContextExternalToolResponse = new ContextExternalToolResponse({
			id: contextExternalTool.id ?? '',
			contextId: contextExternalTool.contextId,
			schoolToolId: contextExternalTool.schoolToolId,
			contextType: contextExternalTool.contextType,
			contextToolName: contextExternalTool.contextToolName,
			toolVersion: contextExternalTool.toolVersion,
			parameters: this.mapRequestToCustomParameterEntryDO(contextExternalTool.parameters),
		});

		return mapped;
	}

	private static mapRequestToCustomParameterEntryDO(
		customParameterParams: CustomParameterEntryParam[]
	): CustomParameterEntryResponse[] {
		const mapped: CustomParameterEntryResponse[] = customParameterParams.map(
			(customParameterParam: CustomParameterEntryParam) => {
				const customParameterEntryResponse: CustomParameterEntryResponse = new CustomParameterEntryResponse({
					name: customParameterParam.name,
					value: customParameterParam.value,
				});

				return customParameterEntryResponse;
			}
		);

		return mapped;
	}
}
