import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { FeathersServiceProvider } from '@shared/infra/feathers';

/**
 * @deprecated Jwts should be generated in authentication module. Legacy Feathers service should not be used
 */
@Injectable()
export class FeathersJwtProvider {
	constructor(private feathersServiceProvider: FeathersServiceProvider) {}

	async generateJwt(userId: EntityId): Promise<string> {
		const service = this.feathersServiceProvider.getService('accounts/supportJWT');
		// This feathers service catches its own errors, so the promise does not get rejected
		const jwt = (await service.create({ userId }, { account: { userId } })) as Promise<string>;
		return jwt;
	}
}
