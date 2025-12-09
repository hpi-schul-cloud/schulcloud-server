import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import {
	HelpdeskProblemCreateParams,
	HelpdeskProblemQueryParams,
	HelpdeskProblemResponse,
	HelpdeskProblemUpdateParams,
} from './dto';
import { HelpdeskUc } from './helpdesk.uc';

@ApiTags('Helpdesk')
@Controller('helpdesk')
export class HelpdeskController {
	constructor(private readonly helpdeskUc: HelpdeskUc) {}

	@Get()
	@JwtAuthentication()
	@ApiOperation({ summary: 'Get helpdesk problems' })
	@ApiOkResponse({ description: 'List of helpdesk problems', type: [HelpdeskProblemResponse] })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	async findProblems(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() query: HelpdeskProblemQueryParams
	): Promise<HelpdeskProblemResponse[]> {
		const problems = await this.helpdeskUc.findHelpdeskProblems(currentUser.userId, currentUser.schoolId, {
			limit: query.$limit || 25,
			skip: query.$skip || 0,
		});
		return problems;
	}

	@Get(':id')
	@JwtAuthentication()
	@ApiOperation({ summary: 'Get a specific helpdesk problem' })
	@ApiOkResponse({ description: 'Helpdesk problem details', type: HelpdeskProblemResponse })
	@ApiNotFoundResponse({ description: 'Helpdesk problem not found' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	async getProblem(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id') id: string
	): Promise<HelpdeskProblemResponse> {
		return this.helpdeskUc.getHelpdeskProblem(currentUser.userId, id);
	}

	@Post()
	@JwtAuthentication()
	@ApiOperation({ summary: 'Create a new helpdesk problem' })
	@ApiOkResponse({ description: 'Helpdesk problem created successfully', type: HelpdeskProblemResponse })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	async createProblem(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: HelpdeskProblemCreateParams
	): Promise<HelpdeskProblemResponse | void> {
		return this.helpdeskUc.createHelpdeskProblem(currentUser.userId, currentUser.schoolId, currentUser.username, body);
	}

	@Patch(':id')
	@JwtAuthentication()
	@ApiOperation({ summary: 'Update a helpdesk problem' })
	@ApiOkResponse({ description: 'Helpdesk problem updated successfully', type: HelpdeskProblemResponse })
	@ApiNotFoundResponse({ description: 'Helpdesk problem not found' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	async updateProblem(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id') id: string,
		@Body() body: HelpdeskProblemUpdateParams
	): Promise<HelpdeskProblemResponse> {
		return this.helpdeskUc.updateHelpdeskProblem(currentUser.userId, id, body);
	}

	@Delete(':id')
	@JwtAuthentication()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete a helpdesk problem' })
	@ApiOkResponse({ description: 'Helpdesk problem deleted successfully' })
	@ApiNotFoundResponse({ description: 'Helpdesk problem not found' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	async deleteProblem(@CurrentUser() currentUser: ICurrentUser, @Param('id') id: string): Promise<void> {
		return this.helpdeskUc.deleteHelpdeskProblem(currentUser.userId, id);
	}
}
