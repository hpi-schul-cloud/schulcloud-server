import { CustomParameterEntry } from '../../common/domain/custom-parameter-entry.do';
import { CustomParameterEntryParam } from '../../school-external-tool/controller/dto/custom-parameter-entry.params';
import { ContextExternalToolPostParams } from '../controller/dto/context-external-tool-post.params';
import { ContextExternalToolDto } from '../uc/dto/context-external-tool.types';

export class ContextExternalToolRequestMapper {
	static mapContextExternalToolRequest(request: ContextExternalToolPostParams): ContextExternalToolDto {
		return {
			id: '',
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
				value: customParameterParam.value,
			};
		});
	}
}
