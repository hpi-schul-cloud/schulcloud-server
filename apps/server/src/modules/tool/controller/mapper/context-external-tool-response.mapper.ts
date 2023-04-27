import { ContextExternalTool } from '../../uc/dto';
import { CustomParameterEntryParam, CustomParameterEntryResponse } from '../dto';
import { ContextExternalToolResponse } from '../dto/response/context-external-tool.response';

export class ContextExternalToolResponseMapper {
	static mapContextExternalToolResponse(contextExternalTool: ContextExternalTool): ContextExternalToolResponse {
		return {
			id: contextExternalTool.id,
			contextId: contextExternalTool.contextId,
			schoolToolId: contextExternalTool.schoolToolId,
			contextType: contextExternalTool.contextType,
			contextToolName: contextExternalTool.contextToolName,
			toolVersion: contextExternalTool.toolVersion,
			parameters: this.mapRequestToCustomParameterEntryDO(contextExternalTool.parameters),
		} as ContextExternalToolResponse;
	}

	private static mapRequestToCustomParameterEntryDO(
		customParameterParams: CustomParameterEntryParam[]
	): CustomParameterEntryResponse[] {
		return customParameterParams.map((customParameterParam: CustomParameterEntryParam) => {
			return {
				name: customParameterParam.name,
				value: customParameterParam.value,
			};
		});
	}
}
