import { Factory } from 'fishery';
import { ExternalToolMedium } from '../domain';
import { ExternalToolMediumStatus } from '../enum';

export const externalToolMediumFactory = Factory.define<ExternalToolMedium>(({ sequence }) => {
	const props: ExternalToolMedium = {
		status: ExternalToolMediumStatus.ACTIVE,
		mediumId: `medium-id-${sequence}`,
		publisher: 'publisher',
		mediaSourceId: `media-source-id${sequence}`,
		metadataModifiedAt: undefined,
	};

	return props;
});
