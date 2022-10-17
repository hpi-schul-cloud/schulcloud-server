import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { LtiToolResponse } from '@src/modules/tool/controller/dto/lti-tool.response';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolUc } from '@src/modules/tool/uc/lti-tool.uc';
import { LtiToolResponseMapper } from '@src/modules/tool/mapper/lti-tool-response.mapper';
import { LtiToolBody } from '@src/modules/tool/controller/dto/lti-tool.body';
import { LtiToolMapper } from '@src/modules/tool/mapper/lti-tool.mapper';
import { ToolIdParams } from './dto/tool-id.params';

@Controller('ltitools')
@Authenticate('jwt')
export class LtiToolController {
	constructor(
		private readonly ltiToolUc: LtiToolUc,
		private readonly ltiToolResponseMapper: LtiToolResponseMapper,
		private readonly ltiToolMapper: LtiToolMapper
	) {}

	@Get()
	async findLtiTool(@CurrentUser() currentUser: ICurrentUser): Promise<LtiToolResponse> {
		const tool: LtiToolDO = await this.ltiToolUc.findLtiTool(currentUser);
		const mapped: LtiToolResponse = this.ltiToolResponseMapper.mapDoToResponse(tool);
		return mapped;
	}

	@Get(':toolId')
	async getLtiTool(@CurrentUser() currentUser: ICurrentUser, @Param() params: ToolIdParams): Promise<LtiToolResponse> {
		const tool: LtiToolDO = await this.ltiToolUc.getLtiTool(currentUser, params.toolId);
		const mapped: LtiToolResponse = this.ltiToolResponseMapper.mapDoToResponse(tool);
		return mapped;
	}

	@Post()
	async createLtiTool(@CurrentUser() currentUser: ICurrentUser, @Body() body: LtiToolBody): Promise<LtiToolResponse> {
		const ltiToolDO = this.ltiToolMapper.mapLtiToolBodyToDO(body);
		const createdLtiTool: LtiToolDO = await this.ltiToolUc.createLtiTool(currentUser, ltiToolDO);
		const mapped: LtiToolResponse = this.ltiToolResponseMapper.mapDoToResponse(createdLtiTool);
		return mapped;
	}

	@Patch(':toolId')
	async updateLtiTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams,
		@Body() body: LtiToolBody
	): Promise<LtiToolResponse> {
		const ltiToolDO = this.ltiToolMapper.mapLtiToolBodyToDO(body);
		const updatedLtiTool: LtiToolDO = await this.ltiToolUc.updateLtiTool(currentUser, params.toolId, ltiToolDO);
		const mapped: LtiToolResponse = this.ltiToolResponseMapper.mapDoToResponse(updatedLtiTool);
		return mapped;
	}

	@Delete(':toolId')
	deleteLtiTool(@CurrentUser() currentUser: ICurrentUser, @Param() params: ToolIdParams): Promise<void> {
		const promise: Promise<void> = this.ltiToolUc.deleteLtiTool(currentUser, params.toolId);
		return promise;
	}
}
