import { ITemporaryFileProperties, TemporaryFile } from '@src/modules/h5p-editor/entity';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

const oneDay = 24 * 60 * 60 * 1000;

class H5PTemporaryFileFactory extends BaseFactory<TemporaryFile, ITemporaryFileProperties> {
	isExpired(): this {
		const birthtime = new Date(Date.now() - oneDay * 2); // Created two days ago
		const expiresAt = new Date(Date.now() - oneDay); // Expired yesterday
		const params: DeepPartial<ITemporaryFileProperties> = { expiresAt, birthtime };

		return this.params(params);
	}
}

export const h5pTemporaryFileFactory = H5PTemporaryFileFactory.define(TemporaryFile, ({ sequence }) => {
	return {
		filename: `File-${sequence}.txt`,
		ownedByUserId: `user-${sequence}`,
		birthtime: new Date(Date.now() - oneDay), // Yesterday
		expiresAt: new Date(Date.now() + oneDay), // Tomorrow
		size: sequence,
	};
});
