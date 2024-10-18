import { TypeGuard } from '@shared/common';
import { ValueObject } from './value-object';

describe('ValueObject', () => {
	describe('By passing valid values', () => {
		const setup = () => {
			class Name extends ValueObject<string> {}

			const nameThor1 = new Name('Thor');
			const nameThor2 = new Name('Thor');

			return { nameThor1, nameThor2 };
		};

		it('should be return true by same reference', () => {
			const { nameThor1 } = setup();

			expect(nameThor1.equals(nameThor1)).toBe(true);
		});

		it('should be return true by different references', () => {
			const { nameThor1, nameThor2 } = setup();

			expect(nameThor1.equals(nameThor2)).toBe(true);
		});
	});

	describe('By usage of primitive array as value object', () => {
		const setup = () => {
			class Names extends ValueObject<string[]> {}

			const nameThors1 = new Names(['Thor1', 'Thor2', 'Thor3']);
			const nameThors2 = new Names(['Thor1', 'Thor2', 'Thor3']);
			const nameThorsDifferent = new Names(['Thor1', 'Thor2', 'Thor4']);
			const nameThorsDifferentCount = new Names(['Thor1', 'Thor2']);

			return { nameThors1, nameThors2, nameThorsDifferent, nameThorsDifferentCount };
		};

		it('should be return true by same reference', () => {
			const { nameThors1 } = setup();

			expect(nameThors1.equals(nameThors1)).toBe(true);
		});

		it('should be return true by different references', () => {
			const { nameThors1, nameThors2 } = setup();

			expect(nameThors1.equals(nameThors2)).toBe(true);
		});

		it('should be return false by different values inside the array', () => {
			const { nameThors1, nameThorsDifferentCount } = setup();

			expect(nameThors1.equals(nameThorsDifferentCount)).toBe(false);
		});

		it('should be return false by different values inside the array', () => {
			const { nameThors1, nameThorsDifferent } = setup();

			expect(nameThors1.equals(nameThorsDifferent)).toBe(false);
		});
	});

	describe('When value object with validation is created.', () => {
		const setup = () => {
			class Name extends ValueObject<string> {
				protected validation(value: unknown): boolean {
					let isValid = false;

					if (TypeGuard.isString(value) && this.isValidLength(value)) {
						isValid = true;
					}

					return isValid;
				}

				private isValidLength(value: string): boolean {
					let isValid = false;

					if (value.length > 0 && value.length <= 5) {
						isValid = true;
					}

					return isValid;
				}
			}

			return { Name };
		};

		it('validation should be execute and throw if not valid', () => {
			const { Name } = setup();

			const expectedError = new Error('ValueObject Name validation is failed for input ""');
			expect(() => new Name('')).toThrowError(expectedError);
		});

		it('should execute but not throw if is valid value is passsed', () => {
			const { Name } = setup();

			expect(new Name('Thor')).toBeDefined();
		});
		/*
		it('should execute but not throw if is valid value is passsed', () => {
			const { Name } = setup();

			const myName = new Name('Thor');

			expect(myName.isValidValue('123456')).toBe(false);
			expect(myName.isValidValue('')).toBe(false);
			expect(myName.isValidValue('ABC')).toBe(true);
		});
		*/
	});

	describe('When value object with modification is created.', () => {
		const setup = () => {
			class Name extends ValueObject<string> {
				protected modified(value: string): string {
					let modifedValue = value;

					modifedValue = this.removeWithspacesAtBeginning(value);
					modifedValue = this.truncatedToLength4(modifedValue);

					return modifedValue;
				}

				private removeWithspacesAtBeginning(value: string): string {
					return value.trimStart();
				}

				private truncatedToLength4(value: string): string {
					return value.substring(0, 4);
				}
			}

			return { Name };
		};

		it('should be execute all modifications by creating a new instance', () => {
			const { Name } = setup();

			const myName = new Name('   Thor the God of Thunder!');

			expect(myName.value).toEqual('Thor');
		});
	});

	describe('By passing invalid values', () => {
		const setup = () => {
			class Name extends ValueObject<string> {}
			class OtherString extends ValueObject<string> {}
			// class InvalidType extends ValueObject<{}> {} --> object and functions do not work
			// TODO: Test for array

			const nameThor1 = new Name('Thor');
			const nameUnhappy = new Name('Unhappy');
			const otherThor = new OtherString('Thor');
			const fakeThor = {
				value: 'Thor',
				equals: (vo: ValueObject<string>): boolean => vo === this,
			};

			return { nameThor1, nameUnhappy, otherThor, fakeThor };
		};

		it('should be return false by different value', () => {
			const { nameThor1, nameUnhappy } = setup();

			expect(nameThor1.equals(nameUnhappy)).toBe(false);
		});

		it('should be return false if value object is passed ', () => {
			const { nameThor1, fakeThor } = setup();

			// @ts-expect-error Test case
			expect(nameThor1.equals(fakeThor)).toBe(false);
		});

		it('should be return false by different ValueObjects and same value', () => {
			const { nameThor1, otherThor } = setup();

			expect(nameThor1.equals(otherThor)).toBe(false);
		});
	});
});
