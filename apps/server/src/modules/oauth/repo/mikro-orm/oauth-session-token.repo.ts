import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { EntityManager } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { OauthSessionToken } from '../../domain';
import { OauthSessionTokenEntity } from '../../entity';
import { OauthSessionTokenRepo } from '../oauth-session-token.repo.interface';
import { OauthSessionTokenEntityMapper } from './mapper';

@Injectable()
export class OauthSessionTokenMikroOrmRepo implements OauthSessionTokenRepo {
	constructor(
		private readonly em: EntityManager,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async save(token: OauthSessionToken): Promise<void> {
		const encryptedRefreshToken = this.encryptionService.encrypt(token.refreshToken);

		const props = OauthSessionTokenEntityMapper.mapDOToEntityProperties(token, encryptedRefreshToken, this.em);

		this.em.create(OauthSessionTokenEntity, props);

		await this.em.flush();
	}

	public async delete(token: OauthSessionToken): Promise<void> {
		await this.em.nativeDelete(OauthSessionTokenEntity, { id: token.id });
	}

	public async findLatestByUserId(userId: EntityId): Promise<OauthSessionToken | null> {
		const sortByLatestExpiresAt = { expiresAt: SortOrder.desc };

		const sessionTokenEntity = await this.em.findOne(
			OauthSessionTokenEntity,
			{ user: userId },
			{ orderBy: sortByLatestExpiresAt }
		);

		if (!sessionTokenEntity) {
			return null;
		}

		const decryptedRefreshToken = this.encryptionService.decrypt(sessionTokenEntity.refreshToken);

		const sessionToken = OauthSessionTokenEntityMapper.mapEntityToDo(sessionTokenEntity, decryptedRefreshToken);

		return sessionToken;
	}
}
