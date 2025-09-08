import { AuthenticationService, LoginDto } from '@modules/authentication';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { InstanceService } from '@modules/instance';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { TargetUserIdParams } from './dtos/target-user-id.params';

@Injectable()
export class ShdUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly authenticationService: AuthenticationService,
		private readonly instanceService: InstanceService
	) {}

	public async createSupportJwt(params: TargetUserIdParams, supportUserId: EntityId): Promise<LoginDto> {
		const [supportUser, instance, targetUser] = await Promise.all([
			this.authorizationService.getUserWithPermissions(supportUserId),
			this.instanceService.getInstance(),
			this.authorizationService.getUserWithPermissions(params.userId),
		]);

		const authContext = AuthorizationContextBuilder.write([Permission.CREATE_SUPPORT_JWT]);
		this.authorizationService.checkPermission(supportUser, instance, authContext);

		const jwtToken = await this.authenticationService.generateSupportJwt(supportUser, targetUser);
		const loginDto = new LoginDto({ accessToken: jwtToken });

		return loginDto;
	}
}
