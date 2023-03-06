import { TextElementPayload, TextElementPayloadProps } from '@shared/domain';
import { BaseFactory } from '../../base.factory';

export const textElementPayloadFactory = BaseFactory.define<TextElementPayload, TextElementPayloadProps>(
	TextElementPayload,
	({ sequence }) => {
		return { name: `text-element #${sequence}`, text: `<p>text #${sequence}</p>` };
	}
);
