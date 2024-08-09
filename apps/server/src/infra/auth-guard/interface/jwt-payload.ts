export interface CreateJwtPayload {
	accountId: string;
	userId: string;
	schoolId: string;
	roles: string[];
	systemId?: string; // without this the user needs to change his PW during first login
	support?: boolean;
	// support UserId is missed see featherJS
	isExternalUser: boolean;
}

export interface JwtPayload extends CreateJwtPayload {
	/** audience */
	aud: string;
	/**
	 * expiration in
	 */
	exp: number;
	iat: number;
	/** issuer */
	iss: string;
	jti: string;

	/**
	 * subject
	 */
	sub: string;
}
