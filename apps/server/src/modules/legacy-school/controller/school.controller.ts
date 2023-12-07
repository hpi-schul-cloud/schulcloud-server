import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
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
@Authenticate('jwt')
export class SchoolController {
	constructor(private readonly schoolSystemOptionsUc: SchoolSystemOptionsUc) {}

	@Get('/:schoolId/systems/:systemId')
	@ApiOperation({ description: '' })
	@ApiOkResponse({
		description: 'Set of all provisioning options for the system with their value',
		schema: {
			oneOf: [
				{
					$ref: getSchemaPath(SchulConneXProvisioningOptionsResponse),
				},
			],
		},
	})
	public async getProvisioningOptions(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolSystemParams
	): Promise<SchulConneXProvisioningOptionsResponse> {
		const options: AnyProvisioningOptions = await this.schoolSystemOptionsUc.getProvisioningOptions(
			currentUser.userId,
			params.schoolId,
			params.systemId
		);

		return SchoolSystemOptionsMapper.mapXToResponse(options);
	}

	@Post()
	@ApiOperation({ description: 'Sets all provisioning options for a system' })
	@ApiBody({
		schema: {
			oneOf: [
				{
					$ref: getSchemaPath(SchulConneXProvisioningOptionsParams),
				},
			],
		},
	})
	@ApiOkResponse({
		description: 'Set of all provisioning options for the system with their value',
		schema: {
			oneOf: [
				{
					$ref: getSchemaPath(SchulConneXProvisioningOptionsResponse),
				},
			],
		},
	})
	public async setProvisioningOptions(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolSystemParams,
		@Body() body: ProvisioningOptionsParams
	): Promise<AnyProvisioningOptionsResponse> {
		const options: AnyProvisioningOptions = await this.schoolSystemOptionsUc.setProvisioningOptions(
			currentUser.userId,
			params.schoolId,
			params.systemId,
			body
		);

		return SchoolSystemOptionsMapper.mapXToResponse(options);
	}
}
