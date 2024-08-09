import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
	ApiBody,
	ApiCreatedResponse,
	ApiExtraModels,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
	getSchemaPath,
} from '@nestjs/swagger';
import { AnyProvisioningOptions } from '../domain';
import { SchoolSystemOptionsUc } from '../uc';
import {
	AnyProvisioningOptionsResponse,
	ProvisioningOptionsParams,
	SchoolSystemParams,
	SchulConneXProvisioningOptionsParams,
	SchulConneXProvisioningOptionsResponse,
} from './dto';
import { SchoolSystemOptionsMapper } from './school-system-options.mapper';

@ApiTags('School')
@Controller('schools')
@JwtAuthentication()
export class SchoolController {
	constructor(private readonly schoolSystemOptionsUc: SchoolSystemOptionsUc) {}

	@Get('/:schoolId/systems/:systemId/provisioning-options')
	@ApiOperation({ description: 'Gets all provisioning options for a system at a school' })
	@ApiOkResponse({
		description: 'All provisioning options of the system with their value',
		schema: {
			oneOf: [
				{
					$ref: getSchemaPath(SchulConneXProvisioningOptionsResponse),
				},
			],
		},
	})
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiUnprocessableEntityResponse()
	@ApiNotFoundResponse()
	@ApiExtraModels(SchulConneXProvisioningOptionsResponse)
	public async getProvisioningOptions(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolSystemParams
	): Promise<SchulConneXProvisioningOptionsResponse> {
		const options: AnyProvisioningOptions = await this.schoolSystemOptionsUc.getProvisioningOptions(
			currentUser.userId,
			params.schoolId,
			params.systemId
		);

		const mapped: AnyProvisioningOptionsResponse = SchoolSystemOptionsMapper.mapProvisioningOptionsToResponse(options);

		return mapped;
	}

	@Post('/:schoolId/systems/:systemId/provisioning-options')
	@ApiOperation({ description: 'Sets all provisioning options for a system at a school' })
	@ApiBody({
		type: SchulConneXProvisioningOptionsParams,
	})
	@ApiCreatedResponse({
		description: 'All provisioning options of the system with their value',
		schema: {
			oneOf: [
				{
					$ref: getSchemaPath(SchulConneXProvisioningOptionsResponse),
				},
			],
		},
	})
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiUnprocessableEntityResponse()
	@ApiNotFoundResponse()
	@ApiExtraModels(SchulConneXProvisioningOptionsResponse)
	public async setProvisioningOptions(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolSystemParams,
		@Body() body: ProvisioningOptionsParams
	): Promise<AnyProvisioningOptionsResponse> {
		const options: AnyProvisioningOptions = await this.schoolSystemOptionsUc.createOrUpdateProvisioningOptions(
			currentUser.userId,
			params.schoolId,
			params.systemId,
			body
		);

		const mapped: AnyProvisioningOptionsResponse = SchoolSystemOptionsMapper.mapProvisioningOptionsToResponse(options);

		return mapped;
	}
}
