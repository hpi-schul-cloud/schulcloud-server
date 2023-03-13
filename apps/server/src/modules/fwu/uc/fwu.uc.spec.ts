import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { FwuUc } from './fwu.uc';

describe('FwuUc', () => {
	let module: TestingModule;
	let fwuUc: FwuUc;
	let path: string;

	beforeAll(async () => {
		await setupEntities();
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2023-01-23T09:34:54.854Z'));

		module = await Test.createTestingModule({
			imports: [],
			providers: [
				FwuUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		fwuUc = module.get(FwuUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(fwuUc).toBeDefined();
	});

	describe('get', () => {
		beforeEach(() => {
			path = '5501219/index.html';
			jest.resetAllMocks();
		});

		afterEach(() => {});
		it('find FWU Content on S3', async () => {
			const file = await fwuUc.get(path);
			expect(file).toBeDefined();
		});

		it('Content not found', async () => {
			const falsePath = '123/123testindex.html';
			await expect(async () => {
				await fwuUc.get(falsePath);
			}).rejects.toThrow(Error);
		});
	});
});
