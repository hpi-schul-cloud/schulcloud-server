import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import { CacheStoreType } from '../interface/cache-store-type.enum';

@Injectable()
export class CacheService {
	getStoreType(): CacheStoreType {
		return Configuration.has('REDIS_URI')||Configuration.has('REDIS_CLUSTER_URI') ? CacheStoreType.REDIS : CacheStoreType.MEMORY;
	}
}
