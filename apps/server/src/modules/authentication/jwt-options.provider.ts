import { jwtConstants } from './constants';

export const jwtOptionsProvider = {
	provide: 'JWT_MODULE_OPTIONS',
	useValue: {
		secret: jwtConstants.secret,
		signOptions: { expiresIn: '60s' },
	},
};
