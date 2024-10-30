import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { IdentityManagementOauthService } from './identity-management-oauth.service';
import { IdentityProviderDto } from './identity-management.types';

@Controller('identity-management')
export class IdentityManagementController {
	constructor(private readonly identityManagementService: IdentityManagementOauthService) {}

	@Get('providers/:realmName')
	@ApiOkResponse({ type: [IdentityProviderDto], description: 'Get available identity providers' })
	async getIdentityProviders(@Param('realmName') realmName: string) {
		console.info('Getting identity providers for realm:', realmName);

		const identityProviders = await this.identityManagementService.getIdentityProviders(realmName);

		console.info('Identity providers:', identityProviders);

		return identityProviders;
	}
}
