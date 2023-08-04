import { Injectable } from '@nestjs/common';
import { CustomParameterEntryParam, SchoolExternalToolPostParams } from '../controller/dto';
import { SchoolExternalToolDto } from '../uc/dto/school-external-tool.types';
import { CustomParameterEntry } from '../../common/domain';

@Injectable()
export class SchoolExternalToolRequestMapper {
	mapSchoolExternalToolRequest(request: SchoolExternalToolPostParams): SchoolExternalToolDto {
		return {
			toolId: request.toolId,
			schoolId: request.schoolId,
			toolVersion: request.version,
			parameters: this.mapRequestToCustomParameterEntryDO(request.parameters ?? []),
		};
	}

	private mapRequestToCustomParameterEntryDO(
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
