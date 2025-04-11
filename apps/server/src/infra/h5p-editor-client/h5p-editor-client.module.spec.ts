import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { H5pEditorApi } from './generated';
import { H5pEditorClientModule } from './h5p-editor-client.module';

jest.mock('./generated/api');

describe(H5pEditorClientModule.name, () => {
	let module: TestingModule;

	const configServiceMock = createMock<ConfigService>();
	const accessTokenMock = faker.string.alphanumeric(42);
	const requestMock = createMock<Request>({
		headers: {
			authorization: `Bearer ${accessTokenMock}`,
		},
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [H5pEditorClientModule, ConfigModule.forRoot({ isGlobal: true })],
		})
			.overrideProvider(ConfigService)
			.useValue(configServiceMock)
			.overrideProvider(REQUEST)
			.useValue(requestMock)
			.compile();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(module).toBeDefined();
	});

	describe('when resolving providers', () => {
		const setup = () => {
			const url = faker.internet.url();

			configServiceMock.getOrThrow.mockReturnValue(url);

			return {
				url,
			};
		};

		it('should resolve the H5pEditorApi', async () => {
			const { url } = setup();

			const provider = await module.resolve(H5pEditorApi);

			expect(provider).toBeInstanceOf(H5pEditorApi);
			expect(H5pEditorApi).toHaveBeenCalledWith({
				accessToken: accessTokenMock,
				basePath: `${url}/api/v3`,
			});
		});
	});
});
