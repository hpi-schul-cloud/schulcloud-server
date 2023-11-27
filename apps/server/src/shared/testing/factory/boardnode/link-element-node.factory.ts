/* istanbul ignore file */
import { LinkElementNode, LinkElementNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const linkElementNodeFactory = BaseFactory.define<LinkElementNode, LinkElementNodeProps>(
	LinkElementNode,
	({ sequence }) => {
		const url = `https://www.example.com/link/${sequence}`;
		return {
			url,
			title: `The example page ${sequence}`,
		};
	}
);
