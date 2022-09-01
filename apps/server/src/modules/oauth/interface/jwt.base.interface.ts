export interface IJwt {
	sub: string;
	iat?: bigint;
	exp?: bigint;
	iss?: string;
	aud?: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	gender?: string;
	birthdate?: string;
	email?: string;
	uuid: string;
	preferred_username?: string;
}
