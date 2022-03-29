import { emailPattern } from './email-pattern';

describe('email patter', () => {
	it('should accept a valid email', () => {
		expect(emailPattern.test('a@valid.mail')).toBe(true);
	});
	it('should not accept an email with missing @-seperator', () => {
		expect(emailPattern.test('avalid.mail')).toBe(false);
	});
	it('should not accept an email with missing local part', () => {
		expect(emailPattern.test('@valid.mail')).toBe(false);
	});
	it('should not accept an email with missing domain part', () => {
		expect(emailPattern.test('valid@')).toBe(false);
	});
});
