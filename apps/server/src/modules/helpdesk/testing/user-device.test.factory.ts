import { UserDeviceProps } from '../domain/interface';

export const userDevicePropsFactory = {
	create: (props?: Partial<UserDeviceProps>): UserDeviceProps => {
		return {
			deviceUserAgent: 'Test User Agent',
			browserName: 'Test Browser',
			browserVersion: '1.0.0',
			os: 'Test OS',
			...props,
		};
	},
};
