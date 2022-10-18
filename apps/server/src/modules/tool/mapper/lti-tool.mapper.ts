import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolParams } from '@src/modules/tool/controller/dto/request/lti-tool.params';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { LtiToolResponse } from '@src/modules/tool/controller/dto/response/lti-tool.response';
import { LtiToolSortOrder, SortLtiToolParams } from '@src/modules/tool/controller/dto/request/lti-tool-sort.params';
import { SortOrderMap } from '@shared/domain';
import { LtiToolPostBody } from '@src/modules/tool/controller/dto/request/lti-tool-post.body';
import { LtiToolPatchBody } from '@src/modules/tool/controller/dto/request/lti-tool-patch.body';

@Injectable()
export class LtiToolMapper {
	mapLtiToolBodyToDO(body: LtiToolPostBody): LtiToolDO {
		const ltiTool: LtiToolDO = new LtiToolDO({ ...body });
		return ltiTool;
	}

	// TODO: test
	mapLtiToolPatchToDO(body: LtiToolPatchBody): Partial<LtiToolDO> {
		const ltiTool: Partial<LtiToolDO> = { ...body };
		return ltiTool;
	}

	mapDoToResponse(tool: LtiToolDO): LtiToolResponse {
		if (!tool.id) {
			throw new InternalServerErrorException('Missing id of ltiToolDO');
		}

		const ltiTool: LtiToolResponse = new LtiToolResponse({ ...tool, id: tool.id });
		return ltiTool;
	}

	mapSortingQueryToDomain(sortingQuery: SortLtiToolParams): SortOrderMap<LtiToolDO> | undefined {
		const { sortBy } = sortingQuery;
		if (sortBy == null) {
			return undefined;
		}
		if (!Object.values(LtiToolSortOrder).includes(sortBy)) {
			throw new BadRequestException();
		}

		const result: SortOrderMap<LtiToolDO> = {
			[sortBy]: sortingQuery.sortOrder,
		};
		return result;
	}

	mapLtiToolFilterQueryToDO(scope: LtiToolParams): Partial<LtiToolDO> {
		const queryDO: Partial<LtiToolDO> = { ...scope };
		return queryDO;
	}
}
