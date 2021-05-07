export interface ICurrentUser {
	/** authenticated users id */
	userId: string;
	/** users role ids as string[] */
	roles: string[];
	/** users schoolId as string */
	schoolId: string;
	/** account id as string */
	accountId: string;
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
