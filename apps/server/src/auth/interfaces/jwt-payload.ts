export interface JwtPayload {
	/** account id as string */
	accountId: string;
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
	/** users role ids as string[] */
	roles: string[];
	/** users schoolId as string */
	schoolId: string;
	/** // TODO
	 *
	 */
	sub: string;
	/** authenticated users id */
	userId: string;
}
