import { runtimeConfigTestingFactory } from '../testing/runtime-config-value.testing.factory';

describe('runtime config value DO', () => {
	describe('setValue', () => {
		describe('when type is string', () => {
			it('should set a string', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });

				configValue.setValue('updated');

				expect(configValue.getTypeAndValue().value).toEqual('updated');
			});

			it('should fail to set a string to a number type', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });
				expect(() => configValue.setValue(42)).toThrowError();
			});

			describe('when string contains html-tags', () => {
				it('should sanitize the string but keep the valid html-tags', () => {
					const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });

					configValue.setValue('<p>updated <b>value</b></p>');

					expect(configValue.getTypeAndValue().value).toEqual('<p>updated <b>value</b></p>');
				});

				it('should sanitize the string and remove invalid html-tags', () => {
					const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });

					configValue.setValue('<script>alert("xss")</script><p>updated</p>');

					expect(configValue.getTypeAndValue().value).toEqual('<p>updated</p>');
				});
			});
		});

		describe('when type is number', () => {
			it('should set a number', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'number', value: 1 });

				configValue.setValue(2);

				expect(configValue.getTypeAndValue().value).toEqual(2);
			});

			it('should fail to set a number to a string type', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'number', value: 1 });

				expect(() => configValue.setValue('this is not a number')).toThrowError();
			});
		});

		describe('when type is boolean', () => {
			it('should set a boolean', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'boolean', value: true });

				configValue.setValue(false);

				expect(configValue.getTypeAndValue().value).toEqual(false);
			});

			it('should fail to set a boolean to a string type', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'boolean', value: true });

				expect(() => configValue.setValue('this is not a boolean')).toThrowError();
			});
		});
	});

	describe('setValueFromString', () => {
		describe('when type is string', () => {
			it('should set a string', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });

				configValue.setValueFromString('updated');

				expect(configValue.getTypeAndValue().value).toEqual('updated');
			});

			describe('when string contains html-tags', () => {
				it('should sanitize the string but keep the valid html-tags', () => {
					const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });

					configValue.setValueFromString('<p>updated <b>value</b></p>');

					expect(configValue.getTypeAndValue().value).toEqual('<p>updated <b>value</b></p>');
				});

				it('should sanitize the string and remove invalid html-tags', () => {
					const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'initial' });

					configValue.setValueFromString('<script>alert("xss")</script><p>updated</p>');

					expect(configValue.getTypeAndValue().value).toEqual('<p>updated</p>');
				});
			});
		});

		describe('when type is number', () => {
			it('should fail to set a string to a number type', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'number', value: 1 });
				expect(() => configValue.setValueFromString('Not a Number')).toThrowError();
			});

			it('should set a number', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'number', value: 1 });

				configValue.setValueFromString('2');

				expect(configValue.getTypeAndValue().value).toEqual(2);
			});
		});

		describe('when type is boolean', () => {
			it('should set true', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'boolean', value: false });

				configValue.setValueFromString('true');

				expect(configValue.getTypeAndValue().value).toEqual(true);
			});

			it('should set false', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'boolean', value: true });

				configValue.setValueFromString('false');

				expect(configValue.getTypeAndValue().value).toEqual(false);
			});

			it('should fail to set something else to boolean', () => {
				const configValue = runtimeConfigTestingFactory.build({ type: 'boolean', value: true });

				expect(() => configValue.setValueFromString('not a boolean')).toThrowError();
			});
		});
	});
});
