/**
 * Shared repository models, consists of entities and interfaces.
 * Repositories must provide their own interfaces.
 * It is forbidden to reuse existing ones from different layers.
 */

export * from './base.do.repo';
export * from './base.repo';
export * from './legacy-board';
export * from './course';
export * from './coursegroup';
export * from './dashboard';
export * from './federalstate';
export * from './importuser';
export * from './ltitool';
export * from './materials';
export * from './mongo.patterns';
export * from './news';
export * from './role';
export * from './school';
export * from './schoolexternaltool';
export * from './scope';
export * from './submission';
export * from './system';
export * from './task';
export * from './teams';
export * from './user';
export * from './userloginmigration';
export * from './videoconference';
export * from './contextexternaltool';
export * from './externaltool';
export { BaseDomainObjectRepo } from './base-domain-object.repo';
