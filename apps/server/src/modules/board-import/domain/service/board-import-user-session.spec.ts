import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { type AxiosError } from 'axios';
import { boardImportJobFactory } from '../../testing';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { type BoardImportTokenService } from './board-import-token.service';
import { BoardImportUserSession } from './board-import-user-session';

describe(BoardImportUserSession.name, () => {
	let tokenService: DeepMocked<BoardImportTokenService>;

	beforeAll(() => {
		tokenService = createMock<BoardImportTokenService>();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const buildErrorWithStatus = (status: HttpStatus): AxiosError => {
		const error = axiosErrorFactory.build({ response: axiosResponseFactory.build({ status }) });

		return error;
	};

	const setupSession = () => {
		const job = boardImportJobFactory.build();
		const abortController = new AbortController();
		const session = new BoardImportUserSession(job, abortController.signal, tokenService);
		const request = jest.fn<Promise<string>, [string]>();

		return { job, abortController, session, request };
	};

	describe('call', () => {
		describe('when the request succeeds', () => {
			const setup = () => {
				const { job, session, request } = setupSession();
				const token = 'token';
				const response = 'response';

				tokenService.createToken.mockResolvedValueOnce(token);
				request.mockResolvedValueOnce(response).mockResolvedValueOnce(response);

				return { job, session, request, token, response };
			};

			it('should send the request with a token for the job and return the result', async () => {
				const { job, session, request, token, response } = setup();

				const result = await session.call(request);

				expect(tokenService.createToken).toHaveBeenCalledWith(job);
				expect(request).toHaveBeenCalledWith(token);
				expect(result).toEqual(response);
			});

			it('should use the same token for the next request', async () => {
				const { session, request, token } = setup();

				await session.call(request);
				await session.call(request);

				expect(tokenService.createToken).toHaveBeenCalledTimes(1);
				expect(request).toHaveBeenNthCalledWith(2, token);
			});
		});

		describe('when the API answers with 401 one time', () => {
			const setup = () => {
				const { job, session, request } = setupSession();
				const token = 'token';
				const newToken = 'new-token';
				const response = 'response';

				tokenService.createToken.mockResolvedValueOnce(token).mockResolvedValueOnce(newToken);
				request.mockRejectedValueOnce(buildErrorWithStatus(HttpStatus.UNAUTHORIZED)).mockResolvedValueOnce(response);

				return { job, session, request, token, newToken, response };
			};

			it('should send the request again with a new token', async () => {
				const { session, request, newToken, response } = setup();

				const result = await session.call(request);

				expect(request).toHaveBeenNthCalledWith(2, newToken);
				expect(result).toEqual(response);
			});

			it('should remove the first token', async () => {
				const { job, session, request, token } = setup();

				await session.call(request);

				expect(tokenService.removeToken).toHaveBeenCalledWith(job, token);
			});
		});

		describe('when the API answers with 401 two times', () => {
			const setup = () => {
				const { session, request } = setupSession();
				const error = buildErrorWithStatus(HttpStatus.UNAUTHORIZED);

				tokenService.createToken.mockResolvedValueOnce('token').mockResolvedValueOnce('new-token');
				request.mockRejectedValueOnce(buildErrorWithStatus(HttpStatus.UNAUTHORIZED)).mockRejectedValueOnce(error);

				return { session, request, error };
			};

			it('should pass the error after the second request', async () => {
				const { session, request, error } = setup();

				await expect(session.call(request)).rejects.toBe(error);

				expect(request).toHaveBeenCalledTimes(2);
			});
		});

		describe('when the API answers with 403 one time', () => {
			const setup = () => {
				const { job, session, request } = setupSession();
				const token = 'token';
				const newToken = 'new-token';
				const response = 'response';

				tokenService.createToken.mockResolvedValueOnce(token).mockResolvedValueOnce(newToken);
				request.mockRejectedValueOnce(buildErrorWithStatus(HttpStatus.FORBIDDEN)).mockResolvedValueOnce(response);

				return { job, session, request, token, newToken, response };
			};

			it('should send the request again with a new token', async () => {
				const { session, request, newToken, response } = setup();

				const result = await session.call(request);

				expect(request).toHaveBeenNthCalledWith(2, newToken);
				expect(result).toEqual(response);
			});

			it('should remove the first token', async () => {
				const { job, session, request, token } = setup();

				await session.call(request);

				expect(tokenService.removeToken).toHaveBeenCalledWith(job, token);
			});
		});

		describe('when the API answers with 403 two times', () => {
			const setup = () => {
				const { session, request } = setupSession();
				const error = new BoardImportJobRejectedError(BoardImportJobLogReason.BOARD_API_FORBIDDEN);

				tokenService.createToken.mockResolvedValueOnce('token').mockResolvedValueOnce('new-token');
				request
					.mockRejectedValueOnce(buildErrorWithStatus(HttpStatus.FORBIDDEN))
					.mockRejectedValueOnce(buildErrorWithStatus(HttpStatus.FORBIDDEN));

				return { session, request, error };
			};

			it('should reject the job after the second request', async () => {
				const { session, request, error } = setup();

				await expect(session.call(request)).rejects.toMatchObject({ reason: error.reason });

				expect(request).toHaveBeenCalledTimes(2);
			});
		});

		describe('when the request fails with another error', () => {
			const setup = () => {
				const { session, request } = setupSession();
				const error = buildErrorWithStatus(HttpStatus.INTERNAL_SERVER_ERROR);

				tokenService.createToken.mockResolvedValueOnce('token');
				request.mockRejectedValueOnce(error);

				return { session, request, error };
			};

			it('should pass the error and not send the request again', async () => {
				const { session, request, error } = setup();

				await expect(session.call(request)).rejects.toBe(error);

				expect(request).toHaveBeenCalledTimes(1);
			});
		});

		describe('when the signal is aborted', () => {
			const setup = () => {
				const { abortController, session, request } = setupSession();

				abortController.abort();

				return { session, request };
			};

			it('should reject and send no request', async () => {
				const { session, request } = setup();

				await expect(session.call(request)).rejects.toThrow();

				expect(tokenService.createToken).not.toHaveBeenCalled();
				expect(request).not.toHaveBeenCalled();
			});
		});

		describe('when the signal is aborted while the token is created', () => {
			const setup = () => {
				const { abortController, session, request } = setupSession();

				tokenService.createToken.mockImplementationOnce(() => {
					abortController.abort();

					return Promise.resolve('token');
				});

				return { session, request };
			};

			it('should reject and send no request', async () => {
				const { session, request } = setup();

				await expect(session.call(request)).rejects.toThrow();

				expect(request).not.toHaveBeenCalled();
			});
		});

		describe('when the signal is aborted while the request runs', () => {
			const setup = () => {
				const { abortController, session, request } = setupSession();

				tokenService.createToken.mockResolvedValueOnce('token');
				request.mockImplementationOnce(() => {
					abortController.abort();

					return Promise.resolve('response');
				});

				return { session, request };
			};

			it('should reject and not return the result', async () => {
				const { session, request } = setup();

				await expect(session.call(request)).rejects.toThrow();

				expect(request).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('close', () => {
		describe('when the session has a token', () => {
			const setup = async () => {
				const { job, session, request } = setupSession();
				const token = 'token';

				tokenService.createToken.mockResolvedValueOnce(token);
				request.mockResolvedValueOnce('response');
				await session.call(request);

				return { job, session, token };
			};

			it('should remove the token', async () => {
				const { job, session, token } = await setup();

				await session.close();

				expect(tokenService.removeToken).toHaveBeenCalledWith(job, token);
			});
		});

		describe('when the session has no token', () => {
			it('should remove nothing', async () => {
				const { session } = setupSession();

				await session.close();

				expect(tokenService.removeToken).not.toHaveBeenCalled();
			});
		});
	});
});
