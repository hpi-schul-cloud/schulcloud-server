import { ForbiddenException } from '@nestjs/common';
import { Authenticate } from './auth.decorator';

describe('[Authenticate] Decorator', () => {
	it('should fail when non-jwt strategy is set', () => {
		expect(() => Authenticate('foo' as unknown as 'jwt')).toThrow(ForbiddenException);
	});
	it('should fail when no strategy is set', () => {
		expect(() => Authenticate(undefined as unknown as 'jwt')).toThrow(ForbiddenException);
	});
});
