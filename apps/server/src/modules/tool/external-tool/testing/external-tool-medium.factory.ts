import { Factory } from 'fishery';
import { ExternalToolMedium } from '../domain';

export const externalToolMediumFactory = Factory.define<ExternalToolMedium>(({ sequence }) => {
	const props: ExternalToolMedium = {
		mediumId: `mediumId-${sequence}`,
		publisher: 'publisher',
		mediaSourceId: `mediaSourceId-${sequence}`,
	};

	return props;
});
