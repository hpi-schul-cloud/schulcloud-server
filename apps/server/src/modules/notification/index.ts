/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { NotificationType } from './types';
export { NotificationService } from './domain';
export { NOTIFICATION_PUBLIC_API_CONFIG_TOKEN, NotificationPublicApiConfig } from './notification.config';
