import { runtimeConfigTestingFactory } from '../testing/runtime-config-value.testing.factory';

describe('runtime config value DO', () => {
	describe('setValue', () => {
		it('set a string', () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });

			configValue.setValue('updated');

			expect(configValue.getTypeAndValue().value).toEqual('updated');
		});

		it('should fail to set a string to a number type', () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });
			expect(() => configValue.setValue(42)).toThrowError();
		});

		it('set a number', () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'number', value: 1 });

			configValue.setValue(2);

			expect(configValue.getTypeAndValue().value).toEqual(2);
		});

		it('fail to set a number to a string type', () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'number', value: 1 });
			expect(() => configValue.setValue('this is not a number')).toThrowError();
		});

		it('set a boolean', () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'boolean', value: true });
			configValue.setValue(false);
			expect(configValue.getTypeAndValue().value).toEqual(false);
		});

		it('fail to set a boolean to a string type', () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'boolean', value: true });
			expect(() => configValue.setValue('this is not a boolean')).toThrowError();
		});
	});
});
