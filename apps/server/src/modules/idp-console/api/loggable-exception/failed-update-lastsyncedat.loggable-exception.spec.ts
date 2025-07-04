import { ObjectId } from 'bson';
import { FailedUpdateLastSyncedAtLoggableException } from './failed-update-lastsyncedat.loggable-exception';
import { AxiosErrorLoggable } from '@core/error/loggable';
import * as axios from 'axios';

jest.mock('axios', () => {
	return {
		isAxiosError: jest.fn(),
	};
});

const { isAxiosError } = axios;

describe(FailedUpdateLastSyncedAtLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = (isAxios = false) => {
			const message = 'Failed to update lastSyncedAt field for users provisioned by system';
			const systemId = new ObjectId().toHexString();

			jest.mocked(isAxiosError).mockReturnValue(isAxios);

			const axiosError: Error = {
				message: 'fail',
				response: {
					data: { error: 'some error' },
					status: 500,
					statusText: 'Internal Server Error',
					headers: {},
				},
				stack: 'Error stack trace',
			} as unknown as Error;

			const exception = isAxios
				? new FailedUpdateLastSyncedAtLoggableException(systemId, axiosError)
				: new FailedUpdateLastSyncedAtLoggableException(systemId);

			const expectedErrorLogMessage = {
				type: 'SYNCHRONIZATION_ERROR',
				stack: expect.any(String),
				data: {
					systemId,
					errorMessage: message,
				},
			};

			return {
				exception,
				expectedErrorLogMessage,
				systemId,
			};
		};

		it('should log the correct message', () => {
			const { exception, expectedErrorLogMessage } = setup(false);

			const result = exception.getLogMessage();

			expect(result).toEqual(expectedErrorLogMessage);
		});

		describe('when axios error is provided', () => {
			it('should return AxiosErrorLoggable', () => {
				const { exception, systemId } = setup(true);

				const logMessage = exception.getLogMessage();

				expect(logMessage.error).toBeInstanceOf(AxiosErrorLoggable);
				expect(logMessage.data?.errorMessage).toBe(
					'Failed to update lastSyncedAt field for users provisioned by system'
				);
				expect(logMessage.type).toBe('SYNCHRONIZATION_ERROR');
				expect(logMessage.data?.systemId).toBe(systemId);
			});
		});
	});
});
