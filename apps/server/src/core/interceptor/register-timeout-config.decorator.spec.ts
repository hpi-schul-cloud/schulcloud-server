import { RegisterTimeoutConfig } from './register-timeout-config.decorator';
import { TIMEOUT_CONFIG_REGISTRY } from './timeout-config.registry';

describe('RegisterTimeoutConfig', () => {
	describe('when decorator is applied to a class', () => {
		it('should register the config with the registry', () => {
			const token = 'TEST_DECORATOR_TOKEN';
			const initialLength = TIMEOUT_CONFIG_REGISTRY.getTokens().length;

			@RegisterTimeoutConfig(token)
			class DecoratedClass {}

			const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
			expect(tokens).toHaveLength(initialLength + 1);
			expect(tokens).toContain(token);

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

			const DecoratedClass = RegisterTimeoutConfig(token)(OriginalClass);

			expect(DecoratedClass).toBe(OriginalClass);
		});

		it('should allow instantiation of decorated class', () => {
			const token = 'INSTANTIATION_TOKEN';

			@RegisterTimeoutConfig(token)
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

			@RegisterTimeoutConfig(token)
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

			@RegisterTimeoutConfig(token)
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
			const initialLength = TIMEOUT_CONFIG_REGISTRY.getTokens().length;

			@RegisterTimeoutConfig(token1)
			class FirstClass {}

			@RegisterTimeoutConfig(token2)
			class SecondClass {}

			const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();

			expect(tokens).toHaveLength(initialLength + 2);
			expect(tokens).toContain(token1);
			expect(tokens).toContain(token2);

			// Verify both classes are defined
			expect(FirstClass).toBeDefined();
			expect(SecondClass).toBeDefined();
		});

		it('should not register duplicate tokens', () => {
			const token = 'DUPLICATE_DECORATOR_TOKEN';

			@RegisterTimeoutConfig(token)
			class FirstDecoratedClass {}

			@RegisterTimeoutConfig(token)
			class SecondDecoratedClass {}

			const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
			const matchingTokens = tokens.filter((t) => t === token);

			expect(matchingTokens).toHaveLength(1);

			// Verify both classes are defined
			expect(FirstDecoratedClass).toBeDefined();
			expect(SecondDecoratedClass).toBeDefined();
		});
	});
});
