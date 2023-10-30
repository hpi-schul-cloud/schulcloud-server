import { Controller, Get, Param } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { ToolReference } from '../domain/tool-reference';
import { ContextExternalToolResponseMapper } from '../mapper/context-external-tool-response.mapper';
import { ToolReferenceUc } from '../uc/tool-reference.uc';
import { ContextExternalToolContextParams } from './dto/context-external-tool-context.params';
import { ContextExternalToolIdParams } from './dto/context-external-tool-id.params';
import { ToolReferenceListResponse } from './dto/tool-reference-list.response';
import { ToolReferenceResponse } from './dto/tool-reference.response';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools/tool-references')
export class ToolReferenceController {
	constructor(private readonly toolReferenceUc: ToolReferenceUc) {}

	@Get('context-external-tools/:contextExternalToolId')
	@ApiOperation({ summary: 'Get ExternalTool Reference for a given context external tool' })
	@ApiOkResponse({
		description: 'The Tool Reference has been successfully fetched.',
		type: ToolReferenceResponse,
	})
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource.' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	async getToolReference(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolIdParams
	): Promise<ToolReferenceResponse> {
		const toolReference: ToolReference = await this.toolReferenceUc.getToolReference(
			currentUser.userId,
			params.contextExternalToolId
		);

		const toolReferenceResponse: ToolReferenceResponse =
			ContextExternalToolResponseMapper.mapToToolReferenceResponse(toolReference);

		return toolReferenceResponse;
	}

	@Get('/:contextType/:contextId')
	@ApiOperation({ summary: 'Get ExternalTool References for a given context' })
	@ApiOkResponse({
		description: 'The Tool References has been successfully fetched.',
		type: ToolReferenceListResponse,
	})
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource.' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	async getToolReferencesForContext(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolContextParams
	): Promise<ToolReferenceListResponse> {
		const toolReferences: ToolReference[] = await this.toolReferenceUc.getToolReferencesForContext(
			currentUser.userId,
			params.contextType,
			params.contextId
		);

		const toolReferenceResponses: ToolReferenceResponse[] =
			ContextExternalToolResponseMapper.mapToToolReferenceResponses(toolReferences);
		const toolReferenceListResponse = new ToolReferenceListResponse(toolReferenceResponses);

		return toolReferenceListResponse;
	}
}
