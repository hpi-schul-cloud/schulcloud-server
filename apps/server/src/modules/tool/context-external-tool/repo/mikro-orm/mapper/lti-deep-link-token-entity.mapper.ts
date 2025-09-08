import { EntityManager } from '@mikro-orm/mongodb';
import { User } from '@modules/user/repo';
import { LtiDeepLinkToken } from '../../../domain';
import { LtiDeepLinkTokenEntityProps, LtiDeepLinkTokenEntity } from '../lti-deep-link-token.entity';

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
