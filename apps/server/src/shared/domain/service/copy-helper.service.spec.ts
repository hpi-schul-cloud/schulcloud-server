import { Test, TestingModule } from '@nestjs/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { CopyHelperService } from './copy-helper.service';

function createStates(elementStates: CopyStatusEnum[]): CopyStatus[] {
	return elementStates.map((status: CopyStatusEnum) => {
		return {
			title: `title-${Math.floor(Math.random() * 1000)}-${status}`,
			type: CopyElementType.LEAF,
			status,
		};
	});
}

describe('copy helper service', () => {
	let module: TestingModule;
	let copyHelperService: CopyHelperService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [CopyHelperService],
		}).compile();

		copyHelperService = module.get(CopyHelperService);
	});

	describe('inferStatusFromElements', () => {
		describe('no elements', () => {
			it('should return fail if no elements were given', () => {
				const inferedStatus = copyHelperService.deriveStatusFromElements([]);

				expect(inferedStatus).toEqual(CopyStatusEnum.FAIL);
			});
		});

		describe('only direct children', () => {
			it('should set status to success, if all elements could be copied', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				const inferedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(inferedStatus).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status to fail, if no elements could be copied', () => {
				const elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.NOT_IMPLEMENTED]);
				const inferedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(inferedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should set status to partial, if some elements could be copied', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.NOT_IMPLEMENTED]);
				const inferedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(inferedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});
		});

		describe('two levels of children', () => {
			it('should set status to success, if all elements could be copied', () => {
				const [one, two] = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				one.elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				two.elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				const inferedStatus = copyHelperService.deriveStatusFromElements([one, two]);

				expect(inferedStatus).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status to fail, if no elements could be copied', () => {
				const [one, two] = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.FAIL]);
				one.elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.NOT_IMPLEMENTED]);
				two.elements = createStates([CopyStatusEnum.NOT_IMPLEMENTED, CopyStatusEnum.FAIL]);
				const inferedStatus = copyHelperService.deriveStatusFromElements([one, two]);

				expect(inferedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should set status to partial, if one grandchild failed', () => {
				const [one, two] = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				one.elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				two.elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.FAIL]);
				const inferedStatus = copyHelperService.deriveStatusFromElements([one, two]);

				expect(inferedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should set status to partial, if one grandchild was not implemented', () => {
				const [one, two] = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				one.elements = createStates([CopyStatusEnum.NOT_IMPLEMENTED, CopyStatusEnum.SUCCESS]);
				two.elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				const inferedStatus = copyHelperService.deriveStatusFromElements([one, two]);

				expect(inferedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});
		});
	});

	describe('deriveCopyName', () => {
		it('should get name of element and extend it by number in brackets', () => {
			const originalName = 'Test';
			const nameCopy = copyHelperService.deriveCopyName(originalName);

			expect(nameCopy).toEqual(`${originalName} (1)`);
		});

		it('should get name of element and increase an existing number in brackets', () => {
			let originalName = 'Test';
			const basename = originalName;
			originalName += ' (12)';

			const nameCopy = copyHelperService.deriveCopyName(originalName);

			expect(nameCopy).toEqual(`${basename} (13)`);
		});
	});
});
