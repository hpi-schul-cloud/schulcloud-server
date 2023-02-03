import { Session } from 'express-session';

export type ISession = Session & Record<string, unknown>;
