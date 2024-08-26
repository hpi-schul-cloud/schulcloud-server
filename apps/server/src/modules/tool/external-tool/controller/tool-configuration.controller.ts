import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Param } from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ToolContextType } from '../../common/enum';
import { ExternalTool } from '../domain';
import { ToolConfigurationMapper } from '../mapper/tool-configuration.mapper';
import { ContextExternalToolTemplateInfo, ExternalToolConfigurationUc } from '../uc';
import {
	ContextExternalToolConfigurationTemplateListResponse,
	ContextExternalToolConfigurationTemplateResponse,
	ContextExternalToolIdParams,
	ContextRefParams,
	SchoolExternalToolConfigurationTemplateListResponse,
	SchoolExternalToolConfigurationTemplateResponse,
	SchoolExternalToolIdParams,
	SchoolIdParams,
	ToolContextTypesListResponse,
} from './dto';

@ApiTags('Tool')
@JwtAuthentication()
@Controller('tools')
export class ToolConfigurationController {
	constructor(private readonly externalToolConfigurationUc: ExternalToolConfigurationUc) {}

	@Get('context-types')
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Lists all context types available in the SVS' })
	@ApiOkResponse({
		description: 'List of available context types',
		type: ToolContextTypesListResponse,
	})
	public async getToolContextTypes(@CurrentUser() currentUser: ICurrentUser): Promise<ToolContextTypesListResponse> {
		const toolContextTypes: ToolContextType[] = await this.externalToolConfigurationUc.getToolContextTypes(
			currentUser.userId
		);

		const mapped: ToolContextTypesListResponse =
			ToolConfigurationMapper.mapToToolContextTypesListResponse(toolContextTypes);

		return mapped;
	}

	@Get('school/:schoolId/available-tools')
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Lists all available tools that can be added for a given school' })
	@ApiOkResponse({
		description: 'List of available tools for a school',
		type: SchoolExternalToolConfigurationTemplateListResponse,
	})
	public async getAvailableToolsForSchool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolIdParams
	): Promise<SchoolExternalToolConfigurationTemplateListResponse> {
		const availableTools: ExternalTool[] = await this.externalToolConfigurationUc.getAvailableToolsForSchool(
			currentUser.userId,
			params.schoolId
		);

		const mapped: SchoolExternalToolConfigurationTemplateListResponse =
			ToolConfigurationMapper.mapToSchoolExternalToolConfigurationTemplateListResponse(availableTools);

		return mapped;
	}

	@Get(':contextType/:contextId/available-tools')
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Lists all available tools that can be added for a given context' })
	@ApiOkResponse({
		description: 'List of available tools for a context',
		type: ContextExternalToolConfigurationTemplateListResponse,
	})
	public async getAvailableToolsForContext(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextRefParams
	): Promise<ContextExternalToolConfigurationTemplateListResponse> {
		const availableTools: ContextExternalToolTemplateInfo[] =
			await this.externalToolConfigurationUc.getAvailableToolsForContext(
				currentUser.userId,
				currentUser.schoolId,
				params.contextId,
				params.contextType
			);

		const mapped: ContextExternalToolConfigurationTemplateListResponse =
			ToolConfigurationMapper.mapToContextExternalToolConfigurationTemplateListResponse(availableTools);

		return mapped;
	}

	@Get('school-external-tools/:schoolExternalToolId/configuration-template')
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Get the latest configuration template for a School External Tool' })
	@ApiFoundResponse({
		description: 'Configuration template for a School External Tool',
		type: SchoolExternalToolConfigurationTemplateResponse,
	})
	public async getConfigurationTemplateForSchool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolIdParams
	): Promise<SchoolExternalToolConfigurationTemplateResponse> {
		const tool: ExternalTool = await this.externalToolConfigurationUc.getTemplateForSchoolExternalTool(
			currentUser.userId,
			params.schoolExternalToolId
		);

		const mapped: SchoolExternalToolConfigurationTemplateResponse =
			ToolConfigurationMapper.mapToSchoolExternalToolConfigurationTemplateResponse(tool);

		return mapped;
	}

	@Get('context-external-tools/:contextExternalToolId/configuration-template')
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Get the latest configuration template for a Context External Tool' })
	@ApiFoundResponse({
		description: 'Configuration template for a Context External Tool',
		type: ContextExternalToolConfigurationTemplateResponse,
	})
	public async getConfigurationTemplateForContext(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolIdParams
	): Promise<ContextExternalToolConfigurationTemplateResponse> {
		const tool: ContextExternalToolTemplateInfo =
			await this.externalToolConfigurationUc.getTemplateForContextExternalTool(
				currentUser.userId,
				params.contextExternalToolId
			);

		const mapped: ContextExternalToolConfigurationTemplateResponse =
			ToolConfigurationMapper.mapToContextExternalToolConfigurationTemplateResponse(tool);

		return mapped;
	}
}
