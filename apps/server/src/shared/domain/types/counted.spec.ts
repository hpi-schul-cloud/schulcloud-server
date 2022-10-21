import { Page } from '@shared/domain';

describe('Page', () => {
	describe('removeElement', () => {
		function setup() {
			const page = new Page<string>(['str1', 'str2', 'str3'], 3);

			return { page };
		}

		it('should remove an element from the data array at index 1', () => {
			const { page } = setup();

			page.removeElement(1);

			expect(page.data).toEqual(['str1', 'str3']);
		});

		it('should remove an element from the data array and reduce the total count by 1', () => {
			const { page } = setup();

			page.removeElement(1);

			expect(page.total).toEqual(2);
		});
	});
});
