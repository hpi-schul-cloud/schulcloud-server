import { Browser } from 'ua-parser-js/src/enums/ua-parser-enums';

export interface JwtRedisData {
	IP: string;
	Browser: string;
	Device: string;
	privateDevice: boolean;
	expirationInSeconds: number;
}

export const createJwtRedisIdentifier = (accountId: string, jti: string): string => `jwt:${accountId}:${jti}`;

export const createJwtRedisData = (expirationInSeconds: number, privateDevice = false): JwtRedisData => {
	return {
		IP: 'NONE',
		Browser: 'NONE',
		Device: 'NONE',
		privateDevice,
		expirationInSeconds,
	};
};
