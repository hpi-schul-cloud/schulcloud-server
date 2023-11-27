import { CustomParameterEntry } from '../../common/domain';
import { CustomParameterEntryParam } from '../../school-external-tool/controller/dto';
import { ContextExternalToolPostParams } from '../controller/dto';
import { ContextExternalToolDto } from '../uc/dto/context-external-tool.types';

export class ContextExternalToolRequestMapper {
	static mapContextExternalToolRequest(request: ContextExternalToolPostParams): ContextExternalToolDto {
		return {
			schoolToolRef: {
				schoolToolId: request.schoolToolId,
			},
			contextRef: {
				id: request.contextId,
				type: request.contextType,
			},
			displayName: request.displayName,
			toolVersion: request.toolVersion,
			parameters: this.mapRequestToCustomParameterEntryDO(request.parameters ?? []),
		};
	}

	private static mapRequestToCustomParameterEntryDO(
		customParameterParams: CustomParameterEntryParam[]
	): CustomParameterEntry[] {
		return customParameterParams.map((customParameterParam: CustomParameterEntryParam) => {
			return {
				name: customParameterParam.name,
				value: customParameterParam.value || undefined,
			};
		});
	}
}
