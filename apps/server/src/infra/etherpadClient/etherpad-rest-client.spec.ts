import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { axiosResponseFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { of } from 'rxjs';
import {
	EtherpadConfigurationMissingLoggable,
	EtherpadCookiesConfigurationMissingLoggable,
	MissingCookie,
} from './loggable';
import {
	EtherpadAuthorIdResponse,
	EtherpadAuthorPadsResponse,
	EtherpadAuthorResponse,
	EtherpadAuthorSessionsResponse,
	EtherpadAuthorsIdArrayResponse,
	EtherpadAuthorsOfPadResponse,
	EtherpadDeleteResponse,
	EtherpadGroupIdResponse,
	EtherpadGroupResponse,
	EtherpadPadsIdArrayResponse,
	EtherpadSessionsArrayResponse,
	Session,
} from './response';
import { EtherpadRestClient } from './etherpad-rest-client';
import { EtherpadRestClientOptions } from './etherpad-rest-client-options';

describe(EtherpadRestClient.name, () => {
	let client: EtherpadRestClient;

	let httpService: DeepMocked<HttpService>;
	let logger: DeepMocked<Logger>;
	const options: EtherpadRestClientOptions = {
		apiUri: 'https://etherpad.url/api',
		cookieExpirationInSeconds: 7200,
		cookieReleaseThreshold: 7200,
		apiKey: '123666131dadaddsa',
	};

	beforeAll(() => {
		httpService = createMock<HttpService>();
		logger = createMock<Logger>();

		client = new EtherpadRestClient(options, httpService, logger);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		describe('when configuration is missing', () => {
			const setup = () => {
				const badOptions: EtherpadRestClientOptions = {
					apiUri: '',
					cookieExpirationInSeconds: undefined,
					cookieReleaseThreshold: undefined,
					apiKey: '',
				};
				return {
					badOptions,
				};
			};

			it('should log a message', () => {
				const { badOptions } = setup();

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const badOptionsClient = new EtherpadRestClient(badOptions, httpService, logger);

				expect(logger.debug).toHaveBeenCalledWith(new EtherpadConfigurationMissingLoggable());
				expect(logger.debug).toHaveBeenCalledWith(
					new EtherpadCookiesConfigurationMissingLoggable(28800, MissingCookie.cookieExpiration)
				);
				expect(logger.debug).toHaveBeenCalledWith(
					new EtherpadCookiesConfigurationMissingLoggable(7200, MissingCookie.cookieReleaseThreshold)
				);
			});
		});
	});

	describe('createOrGetAuthor', () => {
		describe('when requesting author', () => {
			const setup = () => {
				const authorMapper = '7';
				const authorName = 'Michael';
				const authorIdResponse: EtherpadAuthorIdResponse = new EtherpadAuthorIdResponse();
				authorIdResponse.authorID = '123';
				const response: EtherpadAuthorResponse = new EtherpadAuthorResponse();
				response.code = 0;
				response.message = 'ok';
				response.data = authorIdResponse;

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					authorMapper,
					authorName,
					response,
				};
			};

			it('should make a request to a Etherpad-API', async () => {
				const { authorMapper, authorName } = setup();

				await client.createOrGetAuthor(authorMapper, authorName);

				expect(httpService.get).toHaveBeenCalledWith(
					`${options.apiUri}/createAuthorIfNotExistsFor?apiKey=123666131dadaddsa&name=Michael&authorMapper=7`
				);
			});

			it('should return the response', async () => {
				const { authorMapper, authorName, response } = setup();

				const result: EtherpadAuthorResponse = await client.createOrGetAuthor(authorMapper, authorName);

				expect(result).toEqual(response);
			});
		});
	});
	describe('createOrGetGroup', () => {
		describe('when requesting group', () => {
			const setup = () => {
				const groupMapper = '7';
				const groupIdResponse = new EtherpadGroupIdResponse();
				groupIdResponse.groupID = '123';
				const response: EtherpadGroupResponse = new EtherpadGroupResponse();
				response.code = 0;
				response.message = 'ok';
				response.data = groupIdResponse;

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					groupMapper,
					response,
				};
			};

			it('should make a request to a Etherpad-API', async () => {
				const { groupMapper } = setup();

				await client.createOrGetGroup(groupMapper);

				expect(httpService.get).toHaveBeenCalledWith(
					`${options.apiUri}/createGroupIfNotExistsFor?apiKey=123666131dadaddsa&groupMapper=7`
				);
			});

			it('should return the response', async () => {
				const { groupMapper, response } = setup();

				const result: EtherpadGroupResponse = await client.createOrGetGroup(groupMapper);

				expect(result).toEqual(response);
			});
		});
	});
	describe('listPadsOfAuthor', () => {
		describe('when requesting pads of author', () => {
			const setup = () => {
				const authorID = '7hhajekaad789213';
				const groupIdResponse = new EtherpadPadsIdArrayResponse();
				groupIdResponse.padIDs = ['123', '567'];
				const response: EtherpadAuthorPadsResponse = new EtherpadAuthorPadsResponse();
				response.code = 0;
				response.message = 'ok';
				response.data = groupIdResponse;

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					authorID,
					response,
				};
			};

			it('should make a request to a Etherpad-API', async () => {
				const { authorID } = setup();
				await client.listPadsOfAuthor(authorID);
				expect(httpService.get).toHaveBeenCalledWith(
					`${options.apiUri}/listPadsOfAuthor?apiKey=123666131dadaddsa&authorID=7hhajekaad789213`
				);
			});

			it('should return the response', async () => {
				const { authorID, response } = setup();
				const result: EtherpadAuthorPadsResponse = await client.listPadsOfAuthor(authorID);
				expect(result).toEqual(response);
			});
		});
	});

	describe('listSessionsOfAuthor', () => {
		describe('when requesting sessions of author ', () => {
			const setup = () => {
				const authorID = '7hhajekaadadf828312hhej';
				const sessionID = '7hhajekaadakhduahdllei';
				const groupID = 'd837akdkjabnhehpplll';
				const validUntil = 7783871668999321;
				const sessionsResponse = new EtherpadSessionsArrayResponse();
				const session = new Session(sessionID, authorID, groupID, validUntil);
				sessionsResponse.sessions = [session];
				const response: EtherpadAuthorSessionsResponse = new EtherpadAuthorSessionsResponse();
				response.code = 0;
				response.message = 'ok';
				response.data = sessionsResponse;

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					authorID,
					response,
				};
			};

			it('should make a request to a Etherpad-API', async () => {
				const { authorID } = setup();
				await client.listSessionsOfAuthor(authorID);
				expect(httpService.get).toHaveBeenCalledWith(
					`${options.apiUri}/listSessionsOfAuthor?apiKey=123666131dadaddsa&authorID=7hhajekaadadf828312hhej`
				);
			});

			it('should return the response', async () => {
				const { authorID, response } = setup();
				const result: EtherpadAuthorSessionsResponse = await client.listSessionsOfAuthor(authorID);
				expect(result).toEqual(response);
			});
		});
	});
	describe('listAuthorsOfPad', () => {
		describe('when requesting authors of pad', () => {
			const setup = () => {
				const padID = '7hhajekaadadf828312';
				const authorsIdResponse = new EtherpadAuthorsIdArrayResponse();
				authorsIdResponse.authorIDs = ['27738712', '8816663'];
				const response: EtherpadAuthorsOfPadResponse = new EtherpadAuthorsOfPadResponse();
				response.code = 0;
				response.message = 'ok';
				response.data = authorsIdResponse;

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					padID,
					response,
				};
			};

			it('should make a request to a Etherpad-API', async () => {
				const { padID } = setup();
				await client.listAuthorsOfPad(padID);
				expect(httpService.get).toHaveBeenCalledWith(
					`${options.apiUri}/listAuthorsOfPad?apiKey=123666131dadaddsa&padID=7hhajekaadadf828312`
				);
			});

			it('should return the response', async () => {
				const { padID, response } = setup();
				const result: EtherpadAuthorsOfPadResponse = await client.listAuthorsOfPad(padID);
				expect(result).toEqual(response);
			});
		});
	});
	describe('deleteSession', () => {
		describe('when deleting session', () => {
			const setup = () => {
				const sessionID = '7hdahuehkaddadf828312';
				const response: EtherpadDeleteResponse = new EtherpadDeleteResponse();
				response.code = 0;
				response.message = 'ok';
				response.data = null;

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					sessionID,
					response,
				};
			};

			it('should make a request to a Etherpad-API', async () => {
				const { sessionID } = setup();
				await client.deleteSession(sessionID);
				expect(httpService.get).toHaveBeenCalledWith(
					`${options.apiUri}/deleteSession?apiKey=123666131dadaddsa&sessionID=7hdahuehkaddadf828312`
				);
			});

			it('should return the response', async () => {
				const { sessionID, response } = setup();
				const result: EtherpadDeleteResponse = await client.deleteSession(sessionID);
				expect(result).toEqual(response);
			});
		});
	});

	describe('deletePad', () => {
		describe('when deleting pad', () => {
			const setup = () => {
				const padID = '7hdahuehkaddadf828312';
				const response: EtherpadDeleteResponse = new EtherpadDeleteResponse();
				response.code = 0;
				response.message = 'ok';
				response.data = null;

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					padID,
					response,
				};
			};

			it('should make a request to a Etherpad-API', async () => {
				const { padID } = setup();
				await client.deletePad(padID);
				expect(httpService.get).toHaveBeenCalledWith(
					`${options.apiUri}/deletePad?apiKey=123666131dadaddsa&padID=7hdahuehkaddadf828312`
				);
			});

			it('should return the response', async () => {
				const { padID, response } = setup();
				const result: EtherpadDeleteResponse = await client.deleteSession(padID);
				expect(result).toEqual(response);
			});
		});
	});
});
