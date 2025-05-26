import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { H5pEditorClientAdapter } from './h5p-editor-client.adapter';
import { H5pEditorClientModule } from './h5p-editor-client.module';

describe(H5pEditorClientModule.name, () => {
	let module: TestingModule;

	beforeEach(async () => {
		const configServiceMock = createMock<ConfigService>();
		configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());
		const requestMock = createMock<Request>({
			headers: {
				authorization: `Bearer ${faker.string.alphanumeric(42)}`,
			},
		});

		module = await Test.createTestingModule({
			imports: [H5pEditorClientModule, ConfigModule.forRoot({ isGlobal: true })],
		})
			.overrideProvider(ConfigService)
			.useValue(configServiceMock)
			.overrideProvider(REQUEST)
			.useValue(requestMock)
			.compile();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when loading the module', () => {
		it('should successfully resolve the providers for the client adapter', async () => {
			const provider = await module.resolve(H5pEditorClientAdapter);

			expect(provider).toBeInstanceOf(H5pEditorClientAdapter);
		});
	});
});
