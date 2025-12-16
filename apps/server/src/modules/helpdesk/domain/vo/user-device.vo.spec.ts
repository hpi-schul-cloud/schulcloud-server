import { UserDeviceProps } from '../interface';
import { UserDevice } from './user-device.vo';

describe('UserDevice', () => {
	describe('when called with all properties', () => {
		const setup = () => {
			const props = {
				deviceUserAgent: 'Mozilla/5.0',
				browserName: 'Chrome',
				browserVersion: '120.0.0.0',
				os: 'macOS',
			};
			return { props };
		};

		it('should assign all properties correctly', () => {
			const { props } = setup();
			const userDevice = new UserDevice(props);

			expect(userDevice).toEqual(props);
		});
	});

	describe('when called with missing optional properties', () => {
		const setup = () => {
			const props = {};

			return { props };
		};

		it('should set all properties to undefined', () => {
			const { props } = setup();
			const userDevice = new UserDevice(props);

			expect(userDevice.deviceUserAgent).toBeUndefined();
			expect(userDevice.browserName).toBeUndefined();
			expect(userDevice.browserVersion).toBeUndefined();
			expect(userDevice.os).toBeUndefined();
		});
	});

	describe('when called with invalid property types', () => {
		it('should throw if deviceUserAgent is not a string', () => {
			const props = { deviceUserAgent: 123 } as unknown as UserDeviceProps;

			expect(() => new UserDevice(props)).toThrow();
		});

		it('should throw if browserName is not a string', () => {
			const props = { browserName: 123 } as unknown as UserDeviceProps;

			expect(() => new UserDevice(props)).toThrow();
		});
		it('should throw if browserVersion is not a string', () => {
			const props = { browserVersion: 123 } as unknown as UserDeviceProps;

			expect(() => new UserDevice(props)).toThrow();
		});
		it('should throw if os is not a string', () => {
			const props = { os: 123 } as unknown as UserDeviceProps;

			expect(() => new UserDevice(props)).toThrow();
		});
	});
});
