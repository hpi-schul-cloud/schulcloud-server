import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'node:net';
import supertest from 'supertest';
import { CommonCartridgeApiModule } from '../common-cartridge-api.app.module';
import { CommonCartridgeFileBuilder } from '../export/builders/common-cartridge-file-builder';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../export/common-cartridge.enums';

// NOTICE: Currently there is no way to write an integrative api test for the CommonCartridgeController
// because we are not able to ensure a correct environment for the tests to run with other microservices.
describe.skip('CommonCartridgeController (API)', () => {
	let module: TestingModule;
	let app: INestApplication<Server>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				CommonCartridgeApiModule,
				ConfigModule.forRoot({
					isGlobal: true,
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
