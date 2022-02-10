/**
 * Shared repository models, consists of entities and interfaces.
 * Repositories must provide their own interfaces.
 * It is forbidden to reuse existing ones from different layers.
 */

export * from './base.repo';
export * from './scope';

export * from './mongo.patterns';

export * from './course';
export * from './coursegroup';
export * from './dashboard';
export * from './files';
export * from './lesson';
export * from './news';
export * from './role';
export * from './storageprovider';
export * from './submission';
export * from './task';
export * from './user';
export * from './importuser';
export * from './filerecord';
