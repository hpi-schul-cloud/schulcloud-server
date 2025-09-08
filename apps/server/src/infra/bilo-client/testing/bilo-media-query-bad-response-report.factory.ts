import { Factory } from 'fishery';
import { ValidationError } from 'class-validator';
import { MediaQueryBadResponseReport } from '../interface';

export const biloMediaQueryBadResponseReportFactory = Factory.define<MediaQueryBadResponseReport>(({ sequence }) => {
	const report: MediaQueryBadResponseReport = {
		mediumId: `medium-id-${sequence}`,
		status: 200,
		validationErrors: [new ValidationError()],
	};

	return report;
});
