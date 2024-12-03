import { EntityManager } from '@mikro-orm/mongodb';
import { User } from '@shared/domain/entity';
import { LtiDeepLinkToken } from '../../../domain';
import { LtiDeepLinkTokenEntity, LtiDeepLinkTokenEntityProps } from '../../../entity';

export class LtiDeepLinkTokenEntityMapper {
	public static mapDOToEntityProperties(
		domainObject: LtiDeepLinkToken,
		em: EntityManager
	): LtiDeepLinkTokenEntityProps {
		const entityProps: LtiDeepLinkTokenEntityProps = {
			id: domainObject.id,
			state: domainObject.state,
			user: em.getReference(User, domainObject.userId),
			expiresAt: domainObject.expiresAt,
		};

		return entityProps;
	}

	public static mapEntityToDo(entity: LtiDeepLinkTokenEntity): LtiDeepLinkToken {
		const domainObject = new LtiDeepLinkToken({
			id: entity.id,
			userId: entity.user.id,
			state: entity.state,
			expiresAt: entity.expiresAt,
		});

		return domainObject;
	}
}
