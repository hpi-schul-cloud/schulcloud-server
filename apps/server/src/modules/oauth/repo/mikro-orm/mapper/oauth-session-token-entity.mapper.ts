import { EntityManager } from '@mikro-orm/mongodb';
import { SystemEntity } from '@modules/system/repo';
import { User } from '@modules/user/repo';
import { OauthSessionToken } from '../../../domain';
import { OauthSessionTokenEntity, OauthSessionTokenEntityProps } from '../../../entity';

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

	public static mapEntityToDo(entity: OauthSessionTokenEntity) {
		const domainObject = new OauthSessionToken({
			id: entity.id,
			userId: entity.user.id,
			systemId: entity.system.id,
			refreshToken: entity.refreshToken,
			expiresAt: entity.expiresAt,
		});

		return domainObject;
	}
}
