import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AuthenticationService, LoginDto } from '@modules/authentication';
import { InstanceService } from '@modules/instance';
import { JwtPayloadFactory } from '@infra/auth-guard';

@Injectable()
export class ShdUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly authenticationService: AuthenticationService,
		private readonly instanceService: InstanceService
	) {}

	public async createSupportJwt(params: XXX, supportUserId: EntityId): Promise<LoginDto> {
		const [supportUser, instance] = await Promise.all([
			this.authorizationService.getUserWithPermissions(supportUserId),
			this.instanceService.getInstance(),
		]);

		const authContext = AuthorizationContextBuilder.write([Permission.CREATE_SUPPORT_JWT]);
		this.authorizationService.checkPermission(supportUser, instance, authContext);

		const createJwtPayload = JwtPayloadFactory.buildFromCurrentUser(params); // TODO: Maybe add something like buildForSupport() ?
		const loginDto = this.authenticationService.generateSupportJwt(createJwtPayload);

		return loginDto;
	}
}
