# S3 client module

This module allows to connect to the S3 storage with our abstraction layer.

## how to use

You need to create a uniq connection token and set it as the connection name in S3Config. And you must use this token when injecting the S3 client into your service. This is **very important** because many modules can use the S3 client module with other configs.

The S3ClientModule.register method await a array of S3Configs also you can create many connection to deferent s3 providers and buckets.

```ts
// your.config.ts
export const YOUR_S3_UNIQ_CONNECTION_TOKEN = "YOUR_S3_UNIQ_CONNECTION_TOKEN";

const s3Config: S3Config = {
  connectionName: YOUR_S3_UNIQ_CONNECTION_TOKEN, // Important!
  endpoint: "",
  region: "",
  bucket: "",
  accessKeyId: "",
  secretAccessKey: "",
};

// your.service.ts

@Injectable()
export class FilesStorageService {
  constructor(
    @Inject(YOUR_S3_UNIQ_CONNECTION_TOKEN) // Important!
    private readonly storageClient: S3ClientAdapter)
}

// your.module.ts
@Module({
 imports: [S3ClientModule.register([s3Config]),]
 providers: [YourService]
})

export class YourModule {}

```
