import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser, IFindOptions, Page } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { PaginationParams } from '@shared/controller';
import { ApiTags } from '@nestjs/swagger';
import { LtiToolMapper } from '../mapper/lti-tool.mapper';
import { LtiToolUc } from '../uc/lti-tool.uc';
import { LtiToolParams } from 'apps/server/src/modules/tool/controller/dto/request/lti-tool.params';
import { LtiToolPostBody } from '@src/modules/tool/controller/dto/request/lti-tool-post.body';
import { LtiToolResponse } from 'apps/server/src/modules/tool/controller/dto/response/lti-tool.response';
import { SortLtiToolParams } from 'apps/server/src/modules/tool/controller/dto/request/lti-tool-sort.params';
import { LtiToolSearchListResponse } from 'apps/server/src/modules/tool/controller/dto/response/lti-tool-search-list.response';
import { ToolIdParams } from 'apps/server/src/modules/tool/controller/dto/request/tool-id.params';
import { LtiToolPatchBody } from '@src/modules/tool/controller/dto/request/lti-tool-patch.body';

@ApiTags('LtiTools')
@Controller('ltitools')
@Authenticate('jwt')
export class LtiToolController {
	constructor(private readonly ltiToolUc: LtiToolUc, private readonly ltiToolMapper: LtiToolMapper) {}

	@Get()
	async findLtiTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() filterQuery: LtiToolParams,
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: SortLtiToolParams
	): Promise<LtiToolSearchListResponse> {
		const options: IFindOptions<LtiToolDO> = { pagination };
		options.order = this.ltiToolMapper.mapSortingQueryToDomain(sortingQuery);
		const query: Partial<LtiToolDO> = this.ltiToolMapper.mapLtiToolFilterQueryToDO(filterQuery);

		const tools: Page<LtiToolDO> = await this.ltiToolUc.findLtiTool(currentUser, query, options);

		const dtoList: LtiToolResponse[] = tools.data.map(
			(tool: LtiToolDO): LtiToolResponse => this.ltiToolMapper.mapDoToResponse(tool)
		);
		const response: LtiToolSearchListResponse = new LtiToolSearchListResponse(
			dtoList,
			tools.total,
			pagination.skip,
			pagination.limit
		);
		return response;
	}

	@Get(':toolId')
	async getLtiTool(@CurrentUser() currentUser: ICurrentUser, @Param() params: ToolIdParams): Promise<LtiToolResponse> {
		const tool: LtiToolDO = await this.ltiToolUc.getLtiTool(currentUser, params.toolId);
		const mapped: LtiToolResponse = this.ltiToolMapper.mapDoToResponse(tool);
		return mapped;
	}

	@Post()
	async createLtiTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: LtiToolPostBody
	): Promise<LtiToolResponse> {
		const ltiToolDO = this.ltiToolMapper.mapLtiToolBodyToDO(body);
		const createdLtiTool: LtiToolDO = await this.ltiToolUc.createLtiTool(currentUser, ltiToolDO);
		const mapped: LtiToolResponse = this.ltiToolMapper.mapDoToResponse(createdLtiTool);
		return mapped;
	}

	@Patch(':toolId')
	async updateLtiTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams,
		@Body() body: LtiToolPatchBody
	): Promise<LtiToolResponse> {
		const ltiToolDO: Partial<LtiToolDO> = this.ltiToolMapper.mapLtiToolPatchToDO(body);
		const updatedLtiTool: LtiToolDO = await this.ltiToolUc.updateLtiTool(currentUser, params.toolId, ltiToolDO);
		const mapped: LtiToolResponse = this.ltiToolMapper.mapDoToResponse(updatedLtiTool);
		return mapped;
	}

	@Delete(':toolId')
	deleteLtiTool(@CurrentUser() currentUser: ICurrentUser, @Param() params: ToolIdParams): Promise<void> {
		const promise: Promise<void> = this.ltiToolUc.deleteLtiTool(currentUser, params.toolId);
		return promise;
	}
}
