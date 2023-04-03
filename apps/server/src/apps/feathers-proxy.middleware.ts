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
		Logger.log(req.path);
		const path = req.path.startsWith('/') ? req.path : `/${req.path}`;

		// RegExp to match everything except /api/vX where X is a number between 3 and 9
		const notNestApiRegex = /^(?!\/api\/v[3-9](?:\/|$)).*$/;

		if (notNestApiRegex.test(path)) {
			Logger.log('feathers call');
			if (req.path === '/' || req.path === '/api') {
				this.logDeprecatedPaths(req, next);
			}
			this.feathersApp(req, res, next);
		} else {
			Logger.log('nest call');
			next();
		}
	}

	private logDeprecatedPaths(req: express.Request, next: express.NextFunction) {
		Logger.error(req.path, 'DEPRECATED-PATH');
		next();
	}
}
