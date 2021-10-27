import { Team, ITeamProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const teamFactory = BaseFactory.define<Team, ITeamProperties>(Team, ({ sequence }) => {
	return {
		name: `team #${sequence}`,
	};
});
