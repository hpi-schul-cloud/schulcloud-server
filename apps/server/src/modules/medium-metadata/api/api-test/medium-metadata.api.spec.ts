import { ErrorResponse } from '@core/error/dto';
import { BiloMediaQueryResponse, biloMediaQueryResponseFactory } from '@infra/bilo-client';
import { vidisOfferItemFactory } from '@infra/vidis-client/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { mediaSourceEntityFactory } from '@modules/media-source';
import { OauthTokenResponse } from '@modules/oauth-adapter';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface/permission.enum';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Response } from 'supertest';
import { OfferDTO } from '@infra/vidis-client/generated';

describe('MediumMetadataController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;
	let axiosMock: MockAdapter;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		axiosMock = new MockAdapter(axios);

		await app.init();

		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'medium-metadata');
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		axiosMock.reset();
		await cleanupCollections(em);
	});

	describe('[GET] medium-metadata/medium/:mediumId/media-source/:mediaSourceId', () => {
		describe('when mediumId, mediaSourceId are given', () => {
			const setup = async () => {
				const mediaSourceEntity = mediaSourceEntityFactory.withBiloFormat().build();

				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({}, [
					Permission.MEDIA_SOURCE_ADMIN,
				]);
				await em.persistAndFlush([superheroAccount, superheroUser, mediaSourceEntity]);
				em.clear();

				axiosMock.onPost(/(.*)\/oauth(.*)/).replyOnce<OauthTokenResponse>(HttpStatus.OK, {
					id_token: 'idToken',
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});
				const responses: BiloMediaQueryResponse[] = biloMediaQueryResponseFactory.buildList(1);

				axiosMock.onPost(/(.*)\/query/).replyOnce(HttpStatus.OK, responses);

				const loggedInClient: TestApiClient = await testApiClient.login(superheroAccount);

				return { loggedInClient, mediaSourceEntity, biloMediaMetaData: responses[0] };
			};

			it('should return the metadata of media source', async () => {
				const { loggedInClient, mediaSourceEntity, biloMediaMetaData } = await setup();

				const response: Response = await loggedInClient.get(
					`medium/medium-id-1/media-source/${mediaSourceEntity.sourceId}`
				);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					name: biloMediaMetaData.data.title,
					description: biloMediaMetaData.data.description,
					publisher: biloMediaMetaData.data.publisher,
					logoUrl: biloMediaMetaData.data.cover.href,
					previewLogoUrl: biloMediaMetaData.data.coverSmall.href,
					modifiedAt: new Date(biloMediaMetaData.data.modified).toISOString(),
				});
			});
		});

		describe('when mediumId not valid', () => {
			const setup = async () => {
				const mediaSourceEntity = mediaSourceEntityFactory.withBiloFormat().build();
				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero();
				await em.persistAndFlush([superheroAccount, superheroUser, mediaSourceEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(superheroAccount);

				return { loggedInClient, mediaSourceEntity };
			};

			it('should return bad request', async () => {
				const { loggedInClient, mediaSourceEntity } = await setup();

				const response: Response = await loggedInClient.get(`medium/%ZZ/media-source/${mediaSourceEntity.sourceId}`);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when medium does not exist', () => {
			const setup = async () => {
				const mediaSourceEntity = mediaSourceEntityFactory.withVidisFormat().build();

				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({}, [
					Permission.MEDIA_SOURCE_ADMIN,
				]);
				await em.persistAndFlush([superheroAccount, superheroUser, mediaSourceEntity]);
				em.clear();

				const responses: OfferDTO[] = vidisOfferItemFactory.buildList(1);

				axiosMock.onGet(/^.*by-region\/.*$/).replyOnce(HttpStatus.OK, responses);

				const loggedInClient: TestApiClient = await testApiClient.login(superheroAccount);

				return { loggedInClient, mediaSourceEntity, vidisMediaMetaData: responses[0] };
			};

			it('should return not found', async () => {
				const { loggedInClient, mediaSourceEntity } = await setup();

				const response: Response = await loggedInClient.get(`medium/ZZ/media-source/${mediaSourceEntity.sourceId}`);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when mediaSource does not exist', () => {
			const setup = async () => {
				const mediaSourceEntity = mediaSourceEntityFactory.withBiloFormat().build();

				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero();
				await em.persistAndFlush([superheroAccount, superheroUser, mediaSourceEntity]);
				em.clear();

				axiosMock.onPost(/(.*)\/oauth(.*)/).replyOnce<OauthTokenResponse>(HttpStatus.OK, {
					id_token: 'idToken',
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});
				const responses: BiloMediaQueryResponse[] = biloMediaQueryResponseFactory.buildList(1);

				axiosMock.onPost(/(.*)\/query/).replyOnce(HttpStatus.OK, responses);

				const loggedInClient: TestApiClient = await testApiClient.login(superheroAccount);

				return { loggedInClient, mediaSourceEntity, biloMediaMetaData: responses[0] };
			};

			it('should return not found', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.get(`medium/medium-id-1/media-source/some-id`);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when mediaSourceId not valid', () => {
			const setup = async () => {
				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({}, [
					Permission.MEDIA_SOURCE_ADMIN,
				]);
				await em.persistAndFlush([superheroAccount, superheroUser]);
				em.clear();

				axiosMock.onPost(/(.*)\/oauth(.*)/).replyOnce<OauthTokenResponse>(HttpStatus.OK, {
					id_token: 'idToken',
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});

				const loggedInClient: TestApiClient = await testApiClient.login(superheroAccount);

				return { loggedInClient };
			};

			it('should returnbad request', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.get(`medium/medium-id-1/media-source/%ZZ`);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = () => {
				const mediaSourceEntity = mediaSourceEntityFactory.withBiloFormat().build();
				return {
					mediaSourceEntity,
				};
			};

			it('should return unauthorized', async () => {
				const { mediaSourceEntity } = setup();

				const response: Response = await testApiClient.get(
					`medium/medium-id-1/media-source/${mediaSourceEntity.sourceId}`
				);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the media source responded with invalid metadata', () => {
			const setup = async () => {
				const mediaSourceEntity = mediaSourceEntityFactory.withBiloFormat().build();

				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({}, [
					Permission.MEDIA_SOURCE_ADMIN,
				]);

				await em.persistAndFlush([superheroAccount, superheroUser, mediaSourceEntity]);
				em.clear();

				axiosMock.onPost(/(.*)\/oauth(.*)/).replyOnce<OauthTokenResponse>(HttpStatus.OK, {
					id_token: 'idToken',
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});

				const responses: BiloMediaQueryResponse[] = biloMediaQueryResponseFactory.buildList(1, {
					status: 404,
					data: undefined,
				});

				axiosMock.onPost(/(.*)\/query/).replyOnce(HttpStatus.OK, responses);

				const loggedInClient: TestApiClient = await testApiClient.login(superheroAccount);

				return { loggedInClient, mediaSourceEntity };
			};

			it('should return an internal server error', async () => {
				const { loggedInClient, mediaSourceEntity } = await setup();

				const response: Response = await loggedInClient.get(
					`medium/medium-id-1/media-source/${mediaSourceEntity.sourceId}`
				);

				expect(response.statusCode).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
				expect(response.body).toEqual<ErrorResponse>({
					message: `Bad response from the media source`,
					type: 'BILO_MEDIA_QUERY_BAD_RESPONSE',
					code: 500,
					title: 'Bilo Media Query Bad Response',
				});
			});
		});
	});
});
