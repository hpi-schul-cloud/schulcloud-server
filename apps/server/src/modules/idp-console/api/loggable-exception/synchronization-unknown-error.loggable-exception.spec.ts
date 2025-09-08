import { ObjectId } from 'bson';
import { SynchronizationUnknownErrorLoggableException } from './synchronization-unknown-error.loggable-exception';
import { AxiosErrorLoggable } from '@core/error/loggable';
import * as axios from 'axios';

jest.mock('axios', () => {
	return {
		isAxiosError: jest.fn(),
	};
});

const { isAxiosError } = axios;

describe(SynchronizationUnknownErrorLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = (isAxios = false) => {
			const errorMessage =
				'Unknown error occurred during synchronization process of users provisioned by an external system';
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
				? new SynchronizationUnknownErrorLoggableException(systemId, axiosError)
				: new SynchronizationUnknownErrorLoggableException(systemId);

			const expectedErrorLogMessage = {
				type: 'SYNCHRONIZATION_ERROR',
				stack: expect.any(String),
				data: {
					systemId,
					errorMessage,
				},
			};

			return {
				exception,
				expectedErrorLogMessage,
				axiosError,
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
				const { exception, expectedErrorLogMessage, systemId } = setup(true);

				const logMessage = exception.getLogMessage();

				expect(logMessage.error).toBeInstanceOf(AxiosErrorLoggable);
				expect(logMessage.data?.errorMessage).toBe(
					'Unknown error occurred during synchronization process of users provisioned by an external system'
				);
				expect(logMessage.type).toBe(expectedErrorLogMessage.type);
				expect(logMessage.data?.systemId).toBe(systemId);
			});
		});
	});
});
