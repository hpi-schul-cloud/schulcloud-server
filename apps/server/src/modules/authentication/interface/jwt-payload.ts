// TODO: should not get from this place over path
import { ResolvedUser } from '@shared/domain/entity';

export interface ICurrentUser {
	/** authenticated users id */
	userId: string;
	/** users role ids as string[] */
	roles: string[];
	/** users schoolId as string */
	schoolId: string;
	/** account id as string */
	accountId: string;

	user: ResolvedUser;
}

export interface JwtPayload extends ICurrentUser {
	/** audience */
	aud: string;
	/** expiration in // TODO
	 *
	 */
	exp: number;
	iat: number;
	/** issuer */
	iss: string;
	jti: string;

	/** // TODO
	 *
	 */
	sub: string;
}
