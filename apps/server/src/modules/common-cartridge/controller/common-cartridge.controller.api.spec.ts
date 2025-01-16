import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesApi } from '@src/infra/courses-client/generated';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import supertest from 'supertest';
import { CommonCartridgeApiModule } from '../common-cartridge-api.app.module';
import { CommonCartridgeFileBuilder } from '../export/builders/common-cartridge-file-builder';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../export/common-cartridge.enums';

jest.mock('../../../infra/courses-client/generated/api/courses-api', () => {
	const coursesApiMock = createMock<CoursesApi>();

	coursesApiMock.courseControllerCreateCourse.mockResolvedValue(axiosResponseFactory.build({ status: 201 }));

	return {
		CoursesApi: jest.fn(() => coursesApiMock),
	};
});
jest.mock('../../../infra/auth-guard/decorator/jwt-auth.decorator', () => {
	return {
		CurrentUser: () => jest.fn(() => createMock<ICurrentUser>()),
		JwtAuthentication: () => jest.fn(),
	};
});

describe('CommonCartridgeController (API)', () => {
	let module: TestingModule;
	let app: INestApplication;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				CommonCartridgeApiModule,
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						() => {
							return {
								SC_DOMAIN: faker.internet.url(),
								API_HOST: faker.internet.url(),
								JWT_PUBLIC_KEY: faker.string.alphanumeric(42),
								JWT_SIGNING_ALGORITHM: 'RS256',
								INCOMING_REQUEST_TIMEOUT: 10_000,
								NEST_LOG_LEVEL: 'error',
								FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: 10_000,
							};
						},
					],
				}),
			],
		}).compile();
		app = module.createNestApplication();

		await app.init();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('importCourse', () => {
		const setup = () => {
			const ccBuilder = new CommonCartridgeFileBuilder({
				identifier: 'course-1',
				version: CommonCartridgeVersion.V_1_1_0,
			});

			ccBuilder.addMetadata({
				type: CommonCartridgeElementType.METADATA,
				title: 'Course 1',
				creationDate: new Date(),
				copyrightOwners: ['Teacher 1'],
			});

			const ccFile = ccBuilder.build();

			return {
				ccFile,
			};
		};

		it('should import a course from a Common Cartridge file', async () => {
			const { ccFile } = setup();

			const response = await supertest(app.getHttpServer())
				.post('/common-cartridge/import')
				.set('Authorization', `Bearer ${faker.string.alphanumeric(42)}`)
				.set('Content-Type', 'application/octet-stream')
				.attach('file', ccFile, 'course-1.zip');

			expect(response.status).toBe(201);
		});
	});
});
