import { Test, TestingModule } from '@nestjs/testing';
import { PageContentMapper } from './page-content.mapper';
import { PageContentDto } from '../service/dto/page-content.dto';

describe('PageContentMapper', () => {
	let module: TestingModule;
	let mapper: PageContentMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [PageContentMapper],
		}).compile();
		mapper = module.get(PageContentMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when it maps from dto to response', () => {
		let dto: PageContentDto;
		beforeAll(() => {
			dto = {
				proceedButtonUrl: 'proceed',
				cancelButtonUrl: 'cancel',
			};
		});
		it('should map the dto to a response', () => {
			const response = mapper.mapDtoToResponse(dto);
			expect(response.proceedButtonUrl).toEqual(dto.proceedButtonUrl);
			expect(response.cancelButtonUrl).toEqual(dto.cancelButtonUrl);
		});
	});
});
