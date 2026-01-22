import { LearnroomConfig } from '@modules/learnroom';
import { UserConfig } from '@modules/user';

export interface PseudonymConfig extends UserConfig, LearnroomConfig {}
