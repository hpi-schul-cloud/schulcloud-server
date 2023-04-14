import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import express, { Request, Response, NextFunction } from 'express';

/**
 * Nest middleware which handles the routing to nest and feathers.
 */
@Injectable()
export class FeathersProxyMiddleware implements NestMiddleware {
	private feathersApp: express.Express;

	constructor(feathersApp: express.Express) {
		this.feathersApp = feathersApp;
	}

	use(req: Request, res: Response, next: NextFunction) {
		const path = req.path.startsWith('/') ? req.path : `/${req.path}`;

		// RegExp to match /api/vX where X is a number between 3 and 9
		const nestRegex = /^\/api\/v[3-9]/;

		if (nestRegex.test(path)) {
			Logger.debug('nest call');
			next();
		} else {
			Logger.debug('feathers call');
			if (path !== '/serverversion' && !path.startsWith('/api/v')) {
				this.logDeprecatedPaths(req);
			}
			// Replace /api/v\d+ with empty string to call endpoint in feathers
			req.url = path.replace(/^\/api\/v\d+/, '');

			this.feathersApp(req, res, next);
		}
	}

	private logDeprecatedPaths(req: express.Request) {
		Logger.warn(req.path, 'DEPRECATED-PATH');
	}
}
