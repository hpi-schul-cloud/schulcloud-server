import { BaseFactory } from '@shared/testing';
import { VidisItemDto, VidisItemProps } from '@modules/school-license/dto/vidis-item.dto';

export const vidisItemDtoFactory = BaseFactory.define<VidisItemDto, VidisItemProps>(VidisItemDto, ({ sequence }) => {
	return {
		offerId: `id-${sequence}`,
		schoolActivations: ['00100', '00200', '00300'],
	};
});
