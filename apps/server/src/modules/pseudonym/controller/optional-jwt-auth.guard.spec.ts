import { JwtAuthGuard } from '@infra/auth-guard';
import { type ExecutionContext } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe(OptionalJwtAuthGuard.name, () => {
	it('allows an iframe request without a JWT', () => {
		const context = {
			switchToHttp: () => {
				return {
					getRequest: () => {
						return { headers: {} };
					},
				};
			},
		} as ExecutionContext;
		const guard = new OptionalJwtAuthGuard();

		expect(guard.canActivate(context)).toBe(true);
	});

	it('validates a present JWT with the normal guard', () => {
		const context = {
			switchToHttp: () => {
				return {
					getRequest: () => {
						return { headers: { cookie: 'jwt=token' } };
					},
				};
			},
		} as ExecutionContext;
		const guard = new OptionalJwtAuthGuard();
		const validate = jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockReturnValueOnce(false);

		expect(guard.canActivate(context)).toBe(false);
		expect(validate).toHaveBeenCalledWith(context);
		validate.mockRestore();
	});
});
