import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import archiver from 'archiver';
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
			imports: [CommonCartridgeApiModule],
		}).compile();
		app = module.createNestApplication();

		await app.init();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('importCourse', () => {
		const setup = async () => {
			const archive = archiver('zip');
			const logger = createMock<Logger>();
			const ccBuilder = new CommonCartridgeFileBuilder(
				{
					identifier: 'course-1',
					version: CommonCartridgeVersion.V_1_1_0,
				},
				archive,
				logger
			);

			ccBuilder.addMetadata({
				type: CommonCartridgeElementType.METADATA,
				title: 'Course 1',
				creationDate: new Date(),
				copyrightOwners: ['Teacher 1'],
			});

			ccBuilder.build();

			const buffer = await new Promise<Buffer>((resolve, reject) => {
				const chunks: Buffer[] = [];
				archive.on('data', (chunk: Buffer) => chunks.push(chunk));
				archive.on('end', () => resolve(Buffer.concat(chunks)));
				archive.on('error', reject);
			});

			return {
				buffer,
			};
		};

		it('should import a course from a Common Cartridge file', async () => {
			const { buffer } = await setup();

			const response = await supertest(app.getHttpServer())
				.post('/common-cartridge/import')
				.set('Authorization', `Bearer ${faker.string.alphanumeric(42)}`)
				.set('Content-Type', 'application/octet-stream')
				.attach('file', buffer, 'course-1.zip');

			expect(response.status).toBe(201);
		});
	});
});
