export interface JwtRedisData {
	IP: string;
	Browser: string;
	Device: string;
	privateDevice: boolean;
	expirationInSeconds: number;
}

export const createJwtRedisData = (expirationInSeconds: number, privateDevice = false): JwtRedisData => {
	return {
		IP: 'NONE',
		Browser: 'NONE',
		Device: 'NONE',
		privateDevice,
		expirationInSeconds,
	};
};
