import { VidisItemDto } from '@modules/school-license/dto';
import { VidisItemResponse } from '../response/vidis-item.response';

export class VidisItemMapper {
	static mapToVidisItems(vidisItemResponse: VidisItemResponse[]): VidisItemDto[] {
		const mapped: VidisItemDto[] = vidisItemResponse.map((item) => this.mapToVidisItem(item));

		return mapped;
	}

	static mapToVidisItem(vidisItemResponse: VidisItemResponse): VidisItemDto {
		return new VidisItemDto({
			offerId: vidisItemResponse.offerId,
			schoolActivations: vidisItemResponse.schoolActivations,
		});
	}
}
