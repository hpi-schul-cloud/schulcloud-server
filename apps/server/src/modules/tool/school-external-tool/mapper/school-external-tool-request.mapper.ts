import { Injectable } from '@nestjs/common';
import { CustomParameterEntry } from '../../common/domain/custom-parameter-entry.do';
import { CustomParameterEntryParam } from '../controller/dto/custom-parameter-entry.params';
import { SchoolExternalToolPostParams } from '../controller/dto/school-external-tool-post.params';
import { SchoolExternalToolDto } from '../uc/dto/school-external-tool.types';

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
