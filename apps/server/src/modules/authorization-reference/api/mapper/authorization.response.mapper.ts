import { EntityId } from '@shared/domain/types';
import { AuthorizedReponse } from '../dto/authorization.reponse';

export class AuthorizationReponseMapper {
	public static mapToResponse(userId: EntityId, isAuthorized: boolean): AuthorizedReponse {
		const authorizationReponse = new AuthorizedReponse({
			userId,
			isAuthorized,
		});

		return authorizationReponse;
	}
}
