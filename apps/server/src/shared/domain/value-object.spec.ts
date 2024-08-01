import { ValueObject } from './value-object';

describe('ValueObject', () => {
	const setup = () => {
		class Name extends ValueObject<string> {}
		class OtherString extends ValueObject<string> {}
		// class InvalidType extends ValueObject<{}> {} --> object and functions do not work
		// TODO: Test for array

		const nameThor1 = new Name('Thor');
		const nameThor2 = new Name('Thor');
		const nameUnhappy = new Name('Unhappy');
		const otherThor =  new OtherString('Thor');
		const fakeThor = {
			value: 'Thor',
			equals: function (vo: ValueObject<string>): boolean {
				return true;
			}
		};

		return { nameThor1, nameThor2, nameUnhappy, otherThor, fakeThor };
	}

	it('should be return true by same reference', () => {
		const { nameThor1 } = setup();

		expect(nameThor1.equals(nameThor1)).toBe(true);
	});

	it('should be return true by different references', () => {
		const { nameThor1, nameThor2 } = setup();

		expect(nameThor1.equals(nameThor2)).toBe(true);
	});

	it('should be return false by different value', () => {
		const { nameThor1, nameUnhappy } = setup();

		expect(nameThor1.equals(nameUnhappy)).toBe(false);
	});

	it('should be return false if value object is passed ', () => {
		const { nameThor1, fakeThor } = setup();

		expect(nameThor1.equals(fakeThor)).toBe(false);
	});

	it('should be return false by different ValueObjects and same value', () => {
		const { nameThor1, otherThor } = setup();

		expect(nameThor1.equals(otherThor)).toBe(false);
	});
});
