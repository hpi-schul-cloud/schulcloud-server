import { MoinSchuleSystemNotFoundLoggableException } from '@modules/user-login-migration/loggable/moin-schule-system-not-found.loggable-exception';

describe(MoinSchuleSystemNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception: MoinSchuleSystemNotFoundLoggableException = new MoinSchuleSystemNotFoundLoggableException();

			return {
				exception,
			};
		};

		it('should return log message', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'MOIN_SCHULE_SYSTEM_NOT_FOUND',
				message: 'Cannot find moin.schule system',
				stack: exception.stack,
			});
		});
	});
});
