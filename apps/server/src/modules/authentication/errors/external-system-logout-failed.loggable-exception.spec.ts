import { ObjectId } from '@mikro-orm/mongodb';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { ExternalSystemLogoutFailedLoggableException } from './external-system-logout-failed.loggable-exception';

describe(ExternalSystemLogoutFailedLoggableException.name, () => {
	describe('getLogMessage', () => {
		describe('when the provided axios error does not has response data', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const axiosError = axiosErrorFactory.build({
					response: axiosResponseFactory.build({
						data: undefined,
						status: 400,
					}),
				});
				const exception = new ExternalSystemLogoutFailedLoggableException(userId, systemId, axiosError);

				const expectedAxiosErrorData = JSON.stringify({
					status: axiosError.status,
					data: axiosError.message,
				});

				return {
					exception,
					userId,
					systemId,
					expectedAxiosErrorData,
				};
			};

			it('should return the correct log message', () => {
				const { exception, userId, systemId, expectedAxiosErrorData } = setup();

				const message = exception.getLogMessage();

				expect(message).toEqual({
					type: 'INTERNAL_SERVER_ERROR',
					stack: exception.stack,
					message: `Request to logout external system ${systemId} for user ${userId} had failed`,
					data: {
						userId,
						systemId,
						axiosError: expectedAxiosErrorData,
					},
				});
			});
		});

		describe('when the provided axios error has response data', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const axiosError = axiosErrorFactory.build({
					response: axiosResponseFactory.build({
						data: 'test error',
						status: 400,
					}),
				});
				const exception = new ExternalSystemLogoutFailedLoggableException(userId, systemId, axiosError);

				const expectedAxiosErrorData = JSON.stringify({
					status: axiosError.status,
					data: axiosError.response?.data,
				});

				return {
					exception,
					userId,
					systemId,
					expectedAxiosErrorData,
				};
			};

			it('should return the correct log message', () => {
				const { exception, userId, systemId, expectedAxiosErrorData } = setup();

				const message = exception.getLogMessage();

				expect(message).toEqual({
					type: 'INTERNAL_SERVER_ERROR',
					stack: exception.stack,
					message: `Request to logout external system ${systemId} for user ${userId} had failed`,
					data: {
						userId,
						systemId,
						axiosError: expectedAxiosErrorData,
					},
				});
			});
		});
	});
});
