export interface CreateJwtPayload {
	accountId: string;
	userId: string;
	schoolId: string;
	roles: string[];
	systemId?: string; // without this the user needs to change his PW during first login
	support?: boolean;
}

export interface JwtPayload extends CreateJwtPayload {
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
