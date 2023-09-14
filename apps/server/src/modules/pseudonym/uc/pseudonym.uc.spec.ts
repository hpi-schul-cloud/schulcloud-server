import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationParams } from '@shared/controller';
import { Page, Pseudonym } from '@shared/domain';
import { pseudonymFactory } from '@shared/testing';
import { PseudonymSearchQuery } from '../domain';
import { PseudonymService } from '../service';
import { PseudonymUc } from './pseudonym.uc';

describe('PseudonymUc', () => {
	let module: TestingModule;
	let uc: PseudonymUc;

	let pseudonymService: DeepMocked<PseudonymService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				PseudonymUc,
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
			],
		}).compile();

		uc = module.get(PseudonymUc);
		pseudonymService = module.get(PseudonymService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findPseudonym', () => {
		describe('when query and params are given', () => {
			const setup = () => {
				const query: PseudonymSearchQuery = {
					userId: 'userId',
					toolId: 'toolId',
					pseudonym: 'pseudonym',
				};
				const pagination: PaginationParams = {
					limit: 10,
					skip: 1,
				};
				const page: Page<Pseudonym> = new Page<Pseudonym>([pseudonymFactory.build()], 1);

				pseudonymService.findPseudonym.mockResolvedValueOnce(page);

				return {
					query,
					pagination,
					page,
				};
			};

			it('should call service with query and params', async () => {
				const { query, pagination } = setup();

				await uc.findPseudonym(query, pagination);

				expect(pseudonymService.findPseudonym).toHaveBeenCalledWith(query, pagination);
			});

			it('should return page with pseudonyms', async () => {
				const { query, pagination, page } = setup();

				const pseudonymPage: Page<Pseudonym> = await uc.findPseudonym(query, pagination);

				expect(pseudonymPage).toEqual<Page<Pseudonym>>({
					data: [page.data[0]],
					total: page.total,
				});
			});
		});
	});
});
