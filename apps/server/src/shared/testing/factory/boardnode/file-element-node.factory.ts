/* istanbul ignore file */
import { FileElementNode, FileElementNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const fileElementNodeFactory = BaseFactory.define<FileElementNode, FileElementNodeProps>(
	FileElementNode,
	({ sequence }) => {
		return {
			caption: `caption #${sequence}`,
			alternativeText: `alternativeText #${sequence}`,
		};
	}
);
