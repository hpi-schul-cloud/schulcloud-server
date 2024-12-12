import { VidisItemDto } from '@src/modules/school-license/dto';
import { vidisItemResponseFactory } from '../testing/vidis-item.response.factory';
import { VidisItemResponse } from '../response/vidis-item.response';
import { VidisItemMapper } from './vidis-item.mapper';

describe(VidisItemMapper.name, () => {
	describe('mapToVidisItem', () => {
		describe('when a VIDIS item response is given', () => {
			const setup = () => {
				const vidisItemResponse = vidisItemResponseFactory.build();

				return { vidisItemResponse };
			};

			it('should return a mapped VidisItemDto', () => {
				const { vidisItemResponse } = setup();

				const result: VidisItemDto = VidisItemMapper.mapToVidisItem(vidisItemResponse);

				expect(result).toEqual(
					expect.objectContaining({
						offerId: vidisItemResponse.offerId,
						schoolActivations: vidisItemResponse.schoolActivations,
					} as VidisItemDto)
				);
			});
		});
	});

	describe('mapToVidisItems', () => {
		const setup = () => {
			const vidisItemResponses = vidisItemResponseFactory.buildList(3);
			const expectedItemDtos: VidisItemDto[] = vidisItemResponses.map(
				(response: VidisItemResponse) =>
					({
						offerId: response.offerId,
						schoolActivations: response.schoolActivations,
					} as VidisItemDto)
			);

			return { vidisItemResponses, expectedItemDtos };
		};

		it('should return a mapped VidisItemDto', () => {
			const { vidisItemResponses, expectedItemDtos } = setup();

			const results: VidisItemDto[] = VidisItemMapper.mapToVidisItems(vidisItemResponses);

			expect(results.length).toEqual(vidisItemResponses.length);
			expect(results).toEqual(expect.arrayContaining(expectedItemDtos));
		});
	});
});
