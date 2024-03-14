# Configuration state and flows

## Short hints

Every environment variable that is used or refactored, should be added to ./config/default.schema.json..

We want to avoid any process.env.XXX call inside of the code.
> It is a syncron call that stops the node process for a short moment and other async tasks can not be executed.
> It is not documentated in a single place, or has a description to understand for what it is used.
> Any validation and used default value is set on the called placed and is hard to detected by deploying and reuse on other places.

## History and legacy tech stack

### FeatherJS and Express

Our legacy stack uses featherJS <https://docs.feathersjs.com/api/configuration.html>.
It is embedded in the express application.

Express and featherJS use the environment variable as the default behavior.
NODE_ENV=production|test|default
It is extended over featherJS and directly matched to
./config/
    default.json
    test.json
    prodcution.json (deprecated)
    development.json (matching added by us)

Default is (like it is expected) as default and is overwritten by added environment variables from test.json, or production.json.

## Current and NestJS solutions

### @hpi-schul-cloud/commons

``` javascript
    const { Configuration } = require('@hpi-schul-cloud/commons');

    const url = Configuration.get('FILES_STORAGE__SERVICE_BASE_URL');
```

It is used for parsing any environment value that is added in ./config/default.schema.json.
It is overridden with values in default.json.
The default.json is also overridden by development.json (NODE_ENV==='default'), or test.json. (NODE_ENV==='test').

For legacy featherJS stack, or legacy client it is the only solution that should be used.
For newer nestjs stack we use it for parsing values in the right order, but map it to the nestjs based solution.
> Look to the topic nestjs in this file for more information.

The vue client we pass this values over an api endpoint.
> Look to the topic "Passing configuration to vue client" in this file

``` javascript
    let configBefore;

    before(() => {
        configBefore = Configuration.toObject({ plainSecrets: true });

        Configuration.set('ENVIRONMENT_NAME', 'fake.value');
    });

    after(async () => {
        Configuration.reset(configBefore);
    });

```

### ./config/global.js (deprecated)

To collect and cleanup all existing process.env.XXX calls in code, it exists a step, where all environments variables are moved to global.js file.
This should not be used anymore and cleaned up.

Feel free to move variables to default.schema.json.

### ./config/production.js (deprecated)

This config values should not be used anymore.

The default.schema.json and default.json represent the default values that should be set in all production systems.
All other production values are added over autodeployment configurations.

### ./config/default.schema.json

We want to move any environment variable to this file for now.
> Please add a discription and if possible default values to it.
> Any default values that are set on this files should be for production systems. They can be overridden with autodeployment configurations.

It make sense to cluster variables with same context.
Depending on the context, the motivation for clustering variables can vary, please see current usage for further examples.
For this cases you can add embedded objects. By passing a value to embedded objects, you can write MY_SCOPE_NAME__MY_VARIABLEN_NAME.
The scope name and value is splitted by double underscore ( _ ).
Defaults values for embedded objects do not work well. For this we let the default.json stay alive.

### ./config/default.json

It stays alive and is only used for *default values of embedded objects* in default.schema.json
The values should be the same as in default.schema.json and are added as default values. (means production values)

### ./config/development.json

This file overrides default.json and default.schema.json values.
It is used for local development.
For example it increases the timeouts to enable us to debug stuff.

> Please look to "local setups" topic on this page, if you only want to add your personal settings.

### ./config/test.json

This file overrides default.json and default.schema.json values.
It is used for test executions. (NODE_ENV==='test')
For example to reduce log outputs.
> Please change carefully. It effects all tests in this repository.

For test we can also use injections of the nestjs configuration module, or service to set values for a special test.

> Please look to featherJS test examples or nestjs test examples in this file for configurations that should only effect single tests.

### Auto deployment (overriding and setting additional values)

We have 2 sources that can fullfill and add environments.
One is our auto deployment repository that can set environment values directly over config.jsons.
The other source fetches secrets for .dev systems from gitHub, or 1password for productions.

We only add values to it if we need them. If we want the default values from default.schema.json,
on all production like systems (dev, ref, production), they shouldn't be added to configurations in autodeployment.
> Over this way we can reduce the total amount of environment values in production pods.

<https://github.com/hpi-schul-cloud/dof_app_deploy/blob/main/ansible/group_vars/all/config.yml>

> For documentation on how it is works, plase look at our confluence. No github documentation exists atm.

### Nestjs configuration module

#### Setup configuration interfaces

<https://docs.nestjs.com/techniques/configuration>

We implemented a solution that is based on nestjs and combined it with the parsing from the @hpi-schul-cloud/commons of the existing config files.
In future we want to replace it with a nestjs only solution.

Any module that needs configuration, can define his need by creating a interface file with the schema I*MY_NAME*Config.
In first step we add this interfaces directly to an app config file which extends ...,I*MY_NAME*Config,...,.. .
The combined Iconfig interface can be used to initilized the nestjs configuration module.
The nestjs configuration module is defined globally in the hole app and can be used over injections.

> We force it this way, so that modules can be defined by their needs.
> We only have a single point, where all envirements are added to our application.
> We can easily replace this solution with a nestjs parser instead, of Configuration from @hpi-schul-cloud/commons in future.

This code shows a minimal flow.

``` javascript
    // needed configuration for a module
    export interface UserConfig {
        AVAILABLE_LANGUAGES: string[];
    }

    // server.config.ts
    export interface ServerConfig extends ICoreModuleConfig, UserConfig, IFilesStorageClientConfig {
        NODE_ENV: string;
    }

    // server.module.ts
    import { Module } from '@nestjs/common';
    import { ConfigModule } from '@nestjs/config';
    import serverConfig from './server.config';
    import { createConfigModuleOptions } from '@src/config';


    const serverModules = [
        ConfigModule.forRoot(createConfigModuleOptions(serverConfig))
    ]

    @Module({
        imports: [...serverModules],
    })
    export class ServerModule {}

    //use via injections
    import { ConfigService } from '@nestjs/config';
    import { UserConfig } from '../interfaces';

    constructor(private readonly configService: ConfigService<UserConfig, true>){}

    this.configService.get<string[]>('AVAILABLE_LANGUAGES');

    //use in modules construction
    import { ConfigService } from '@nestjs/config';
    import { Configuration, FileApi } from './filesStorageApi/v3';

    @Module({
    providers: [
        {
            provide: 'Module',
            useFactory: (configService: ConfigService<IFilesStorageClientConfig, true>) => {
                const timeout = configService.get<number>('INCOMING_REQUEST_TIMEOUT');

                const options = new Configuration({
                    baseOptions: { timeout },
                });

                return new FileApi(options, baseUrl + apiUri);
            },
            inject: [ConfigService],
        })
    export class Module {}

```

Mocking in unit and integration tests.

``` javascript
    import { Test, TestingModule } from '@nestjs/testing';
    import { createMock, DeepMocked } from '@golevelup/ts-jest';

    describe('XXX', () => {
        let config: DeepMocked<ConfigService>;
        let app: INestApplication;

        beforeAll(async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: ConfigService,
                        useValue: createMock<ConfigService>(),
                    },
                ],
            }).compile();

            config = module.get(ConfigService);
            app = module.createNestApplication();
        });

        it('XXX', () => {
            config.get.mockReturnValue(['value']);
        })

        afterAll(async () => {
            config.get.mockRestore();
            await app.close();
        })

    });

```

Mocking in api tests.
> A better solution based on nestjs configuration module must be figured out and implemented.
> Please feel free to improve this part and documentation.

``` javascript
    import { Configuration } from '@hpi-schul-cloud/commons';
    import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';

    const configBefore: IConfig = Configuration.toObject({ plainSecrets: true });
    Configuration.set('MY_ENVIREMENT_VARIABLE', 'value');

    // eslint-disable-next-line import/first
    import { ServerTestModule } from '@src/modules/server/server.module';

    describe('XXX', () => {

        beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [ServerTestModule],
            }).compile();
        })

        afterAll(async () => {
            Configuration.reset(configBefore);
        });

    });
```

### Special cases in nestjs

If we want to use values in decorators, we can not use the nestjs configuration module.
The parsing of decorators in files starts first and after it the injections are solved.

It is possible to import the config file of the application directly and use the values.

``` javascript
    import serverConfig from '@src/modules/server/server.config';

    @RequestTimeout(serverConfig().INCOMING_REQUEST_TIMEOUT_COPY_API)
```

## Passing configuration to vue client

It exists an endpoint that exposes environment values.
This values are used by the vue client.
The solution is the only existing way how environments should be passed to the new vue client.

Please be careful! Secrets should be never exposed!
They are readable in browser and request response.

<https://github.com/hpi-schul-cloud/schulcloud-server/blob/main/apps/server/src/modules/server/api/server-config.controller.ts>

<http://{{HOST}}:{{PORT}}/api/v3/config/public>
<http://{{HOST}}:{{PORT}}/api/v3/files/config/public>


## Desired changes in future

We want to remove the different config files and the Configuration from @hpi-schul-cloud/commons package.
We want to use the nestjs solutions over parsing configuration values for different states.
This results in a new format for the default.schema.json file.

We also want to put more environment values to database, to enable us to switching it without redeploys over our dashboard.

## Local setups

You can use the .env convention to set settings that only work for you locally.
For temporary checks you can add environments to your terminal based on the solution of your IOS.
You can also add environments for debugging, or if you run your applications over .vscode/lunch.json with:

``` json
    "env": {
        "NODE_ENV": "test"
    }
```
