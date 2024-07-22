import { ObjectId } from '@mikro-orm/mongodb';
import { CustomParameterEntry } from '../../common/domain';
import { CustomParameterEntryParam, SchoolExternalToolPostParams } from '../controller/dto';
import { SchoolExternalToolProps } from '../domain';

export class SchoolExternalToolRequestMapper {
	public static mapSchoolExternalToolRequest(request: SchoolExternalToolPostParams): SchoolExternalToolProps {
		return {
			id: new ObjectId().toHexString(),
			toolId: request.toolId,
			schoolId: request.schoolId,
			parameters: SchoolExternalToolRequestMapper.mapRequestToCustomParameterEntryDO(request.parameters ?? []),
			isDeactivated: request.isDeactivated,
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
