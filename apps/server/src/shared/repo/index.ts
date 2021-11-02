/**
 * Shared repository models, consists of entities and interfaces.
 * Repositories must provide their own interfaces.
 * It is forbidden to reuse existing ones from different layers.
 */

export * from './query'; // TODO remove
export { Scope } from './scope'; // TODO remove

export * from './lesson';
export * from './files';
