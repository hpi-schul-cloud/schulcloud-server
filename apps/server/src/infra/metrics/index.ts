/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export * from './interceptor';
export { MetricConfig, METRICS_CONFIG_TOKEN } from './metrics.config';
export { MetricsModule } from './metrics.module';
export { MetricsService } from './metrics.service';
