import { EntityManager } from '@mikro-orm/mongodb';
import { SystemEntity } from '@modules/system/entity';
import { User } from '@shared/domain/entity';
import { OauthSessionToken } from '../../../domain';
import { OauthSessionTokenEntityProps } from '../../../entity';

export class OauthSessionTokenEntityMapper {
	public static mapDOToEntityProperties(
		domainObject: OauthSessionToken,
		em: EntityManager
	): OauthSessionTokenEntityProps {
		const entityProps: OauthSessionTokenEntityProps = {
			id: domainObject.id,
			user: em.getReference(User, domainObject.userId),
			system: em.getReference(SystemEntity, domainObject.systemId),
			refreshToken: domainObject.refreshToken,
			expiresAt: domainObject.expiresAt,
		};

		return entityProps;
	}
}
