import { RegisterTimeoutConfig } from './register-timeout-config.decorator';
import { TIMEOUT_CONFIG_REGISTRY } from './timeout-config.registry';
import { TimeoutConfig } from './timeout-interceptor-config';

describe('RegisterTimeoutConfig', () => {
	class MockTimeoutConfig extends TimeoutConfig {
		public incomingRequestTimeout = 30000;
	}

	describe('when decorator is applied to a class', () => {
		it('should register the config with the registry', () => {
			const token = 'TEST_DECORATOR_TOKEN';
			const initialLength = TIMEOUT_CONFIG_REGISTRY.getRegistrations().length;

			@RegisterTimeoutConfig(token, MockTimeoutConfig)
			class DecoratedClass {}

			const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
			expect(registrations).toHaveLength(initialLength + 1);
			expect(registrations).toContainEqual({
				token,
				configConstructor: MockTimeoutConfig,
			});

			// Verify the class is defined
			expect(DecoratedClass).toBeDefined();
		});

		it('should return the original constructor', () => {
			const token = 'CONSTRUCTOR_TEST_TOKEN';

			class OriginalClass {
				public value = 'original';

				public getValue(): string {
					return this.value;
				}
			}

			const DecoratedClass = RegisterTimeoutConfig(token, MockTimeoutConfig)(OriginalClass);

			expect(DecoratedClass).toBe(OriginalClass);
		});

		it('should allow instantiation of decorated class', () => {
			const token = 'INSTANTIATION_TOKEN';

			@RegisterTimeoutConfig(token, MockTimeoutConfig)
			class InstantiableClass {
				public name = 'default';

				public getName(): string {
					return this.name;
				}
			}

			const instance = new InstantiableClass();

			expect(instance).toBeInstanceOf(InstantiableClass);
			expect(instance.name).toBe('default');
			expect(instance.getName()).toBe('default');
		});

		it('should preserve class methods and properties', () => {
			const token = 'PRESERVATION_TOKEN';

			@RegisterTimeoutConfig(token, MockTimeoutConfig)
			class ClassWithMethods {
				private counter = 0;

				public increment(): number {
					this.counter += 1;
					return this.counter;
				}

				public getCounter(): number {
					return this.counter;
				}
			}

			const instance = new ClassWithMethods();

			expect(instance.increment()).toBe(1);
			expect(instance.increment()).toBe(2);
			expect(instance.getCounter()).toBe(2);
		});

		it('should work with classes that have static members', () => {
			const token = 'STATIC_MEMBERS_TOKEN';

			@RegisterTimeoutConfig(token, MockTimeoutConfig)
			class ClassWithStatics {
				public static staticValue = 42;

				public static getStaticValue(): number {
					return ClassWithStatics.staticValue;
				}
			}

			expect(ClassWithStatics.staticValue).toBe(42);
			expect(ClassWithStatics.getStaticValue()).toBe(42);
		});

		it('should register different configs for different classes', () => {
			const token1 = 'FIRST_CLASS_TOKEN';
			const token2 = 'SECOND_CLASS_TOKEN';
			const initialLength = TIMEOUT_CONFIG_REGISTRY.getRegistrations().length;

			class AnotherTimeoutConfig extends TimeoutConfig {
				public incomingRequestTimeout = 60000;
			}

			@RegisterTimeoutConfig(token1, MockTimeoutConfig)
			class FirstClass {}

			@RegisterTimeoutConfig(token2, AnotherTimeoutConfig)
			class SecondClass {}

			const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();

			expect(registrations).toHaveLength(initialLength + 2);
			expect(registrations).toContainEqual({
				token: token1,
				configConstructor: MockTimeoutConfig,
			});
			expect(registrations).toContainEqual({
				token: token2,
				configConstructor: AnotherTimeoutConfig,
			});

			// Verify both classes are defined
			expect(FirstClass).toBeDefined();
			expect(SecondClass).toBeDefined();
		});

		it('should not register duplicate tokens', () => {
			const token = 'DUPLICATE_DECORATOR_TOKEN';

			@RegisterTimeoutConfig(token, MockTimeoutConfig)
			class FirstDecoratedClass {}

			@RegisterTimeoutConfig(token, MockTimeoutConfig)
			class SecondDecoratedClass {}

			const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
			const matchingRegistrations = registrations.filter((reg) => reg.token === token);

			expect(matchingRegistrations).toHaveLength(1);

			// Verify both classes are defined
			expect(FirstDecoratedClass).toBeDefined();
			expect(SecondDecoratedClass).toBeDefined();
		});
	});
});
