import { Factory } from 'fishery';
import { ExternalToolMedium } from '../domain';

export const externalToolMediumFactory = Factory.define<ExternalToolMedium>(({ sequence }) => {
	const props: ExternalToolMedium = {
		mediumId: `medium-id-${sequence}`,
		publisher: 'publisher',
		mediaSourceId: `media-source-id${sequence}`,
		metadataModifiedAt: undefined,
	};

	return props;
});
