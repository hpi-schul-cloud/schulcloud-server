import { CustomParameterEntryParam, CustomParameterEntryResponse } from '../../school-external-tool/controller/dto';
import { ContextExternalToolResponse } from '../controller/dto';
import { ContextExternalTool } from '../domain';

export class ContextExternalToolResponseMapper {
	static mapContextExternalToolResponse(contextExternalTool: ContextExternalTool): ContextExternalToolResponse {
		const mapped: ContextExternalToolResponse = new ContextExternalToolResponse({
			id: contextExternalTool.id ?? '',
			contextId: contextExternalTool.contextRef.id,
			contextType: contextExternalTool.contextRef.type,
			schoolToolId: contextExternalTool.schoolToolRef.schoolToolId,
			displayName: contextExternalTool.displayName,
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
