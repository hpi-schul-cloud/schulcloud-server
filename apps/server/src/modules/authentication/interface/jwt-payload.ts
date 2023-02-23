// TODO: should not get from this place over path
import { ICurrentUser } from './user';

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
