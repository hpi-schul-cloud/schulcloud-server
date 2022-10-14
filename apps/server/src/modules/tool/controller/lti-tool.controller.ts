import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { LtiToolResponse } from '@src/modules/tool/controller/dto/lti-tool.response';
import { ToolIdParams } from '@src/modules/tool/controller/dto/tool-id.params';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolUc } from '@src/modules/tool/uc/lti-tool.uc';
import { LtiToolResponseMapper } from '@src/modules/tool/mapper/lti-tool-response.mapper';

@Controller('ltitools')
@Authenticate('jwt')
export class LtiToolController {
	constructor(private readonly ltiToolUc: LtiToolUc, private readonly ltiToolResponseMapper: LtiToolResponseMapper) {}

	@Get()
	async findLtiTool(@CurrentUser() currentUser: ICurrentUser): Promise<LtiToolResponse> {
		const tool: LtiToolDO = await this.ltiToolUc.findLtiTool(currentUser);
		const mapped: LtiToolResponse = this.ltiToolResponseMapper.mapDoToResponse(tool);
		return mapped;
	}

	@Get(':toolId')
	async getLtiTool(@CurrentUser() currentUser: ICurrentUser, @Param() params: ToolIdParams): Promise<LtiToolResponse> {
		const tool: LtiToolDO = await this.ltiToolUc.getLtiTool(currentUser);
		const mapped: LtiToolResponse = this.ltiToolResponseMapper.mapDoToResponse(tool);
		return mapped;
	}

	@Post()
	async createLtiTool(@CurrentUser() currentUser: ICurrentUser): Promise<LtiToolResponse> {
		const tool: LtiToolDO = await this.ltiToolUc.createLtiTool(currentUser);
		const mapped: LtiToolResponse = this.ltiToolResponseMapper.mapDoToResponse(tool);
		return mapped;
	}

	@Patch(':toolId')
	async updateLtiTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams
	): Promise<LtiToolResponse> {
		const tool: LtiToolDO = await this.ltiToolUc.updateLtiTool(currentUser);
		const mapped: LtiToolResponse = this.ltiToolResponseMapper.mapDoToResponse(tool);
		return mapped;
	}

	@Delete(':toolId')
	deleteLtiTool(@CurrentUser() currentUser: ICurrentUser, @Param() params: ToolIdParams): Promise<void> {
		const promise: Promise<void> = this.ltiToolUc.deleteLtiTool(currentUser, params.toolId);
		return promise;
	}
}
