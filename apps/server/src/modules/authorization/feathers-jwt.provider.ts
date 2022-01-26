import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { FeathersServiceProvider } from '@shared/infra/feathers';

@Injectable()
export class FeathersJwtProvider {
	constructor(private feathersServiceProvider: FeathersServiceProvider) {}

	async generateJwt(userId: EntityId): Promise<string> {
		const service = this.feathersServiceProvider.getService('accounts/supportJWT');
		const jwt = (await service.create({ userId }, { account: { userId } })) as Promise<string>;
		if (jwt == null) throw new NotFoundException();
		return jwt;
	}
}
