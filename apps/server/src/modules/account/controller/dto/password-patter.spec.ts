import { passwordPattern } from './password-pattern';

describe('password patter', () => {
	it('should accept a valid password', () => {
		expect(passwordPattern.test('Asdf 1ds df!')).toBe(true);
	});
	it('should accept a valid password (test proper escpaing)', () => {
		expect(passwordPattern.test('Asdf 1ds \\df')).toBe(true);
		expect(passwordPattern.test('Asdf 1ds /df')).toBe(true);
	});
	it('should not accept a password with less than 8 characters', () => {
		expect(passwordPattern.test('A1!asdf')).toBe(false);
	});
	it('should not accept a password without number', () => {
		expect(passwordPattern.test('Asdfqwer!')).toBe(false);
	});
	it('should not accept a password without special character', () => {
		expect(passwordPattern.test('Asdfqwer1')).toBe(false);
	});
	it('should not accept a password without upper case character', () => {
		expect(passwordPattern.test('asdfqwer1')).toBe(false);
	});
	it('should not accept a password without lower case character', () => {
		expect(passwordPattern.test('ASDFQWER')).toBe(false);
	});
	it('should not accept a password beginning with space', () => {
		expect(passwordPattern.test(' Schulcloud1!')).toBe(false);
	});
	it('should not accept a password ending with space', () => {
		expect(passwordPattern.test('Schulcloud1! ')).toBe(false);
	});
});
