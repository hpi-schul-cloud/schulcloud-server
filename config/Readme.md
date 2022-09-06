# Configuration state and flows

## Short hints

Every new envirment variable/any that is used, or refactored, should be added/moved to ./config/default.schema.json.

We want to avoid any process.env.XXX call inside of the code.
> It is a syncron call that stop for a short moment the process and other async tasks to read the value.
> It is not documentated on a single place, or has a desciption to understand for what it is used.
> Any validation and used default value is set on the called placed and is hard to detected by deploying and reuse on other places.

## history and legacy tech stack

### FeatherJS and Express

Our legacy stack use featherJS <https://docs.feathersjs.com/api/configuration.html>.
It is embedded in the express application.

Express and featherJS use as default behavior the envirment variable
NODE_ENV=production|test|default
It is extended over featherJS and directly matched to
./config/
    default.json
    test.json
    prodcution.json (deprecated)
    development.json (matching added by us)

Default is (like it is expected) as default and is overritten by added envirement variables from test.json, or production.json.

## current and NestJS solutions

## @hpi-schul-cloud/commons

``` javascript
    const { Configuration } = require('@hpi-schul-cloud/commons');

    const url = Configuration.get('FILES_STORAGE__SERVICE_BASE_URL');
```

It is used for parsing any envirment value that is added in ./config/default.schema.json.
It is overriden with values in default.json.
The default.json is also overriden by development.json (NODE_ENV==='default'), or test.json. (NODE_ENV==='test').

For legacy featherJS stack, or legacy client it is the only solution that should used.
For newer nestjs stack we use it for parsing values in the right order, but map it to the nestjs based solution.
> Look to the topic nestjs points in this file for more information.

We vue client we pass this values over a api endpoint.
> Look to the topic "Passing configuration to vue client" in this file

``` javascript
    let configBefore;

    before(() => {
        configBefore = Configuration.toObject({ plainSecrets: true });

        Configuration.set('ENVIREMENT_NAME', 'fake.value');
    });

    after(async () => {
        Configuration.reset(configBefore);
    });

```

### ./config/global.js (deprecated)

To collect and cleanup all existing process.env.XXX calls in code, it exist a step, where all envirements variables are moved to global.js file.
This is should not be used anymore and cleanup step by step.

Feel free to move variables to default.schema.json.

### ./config/production.js (deprecated)

This config values should not be use anymore.

The default.schema.json and default.json are represented the default values that should set in all production systems.
All others production values are added over autodeployment configurations.

### ./config/default.schema.json

We want to move any envirment variable to this file for now.
> Please add a discription and if possible default values to it.
> Any default values that are set on this files should be for production systems. They can override with autodeployment configurations.

It make sense to cluster variables with same context. The situation can be different, but look like it is used atm.
For this cases you can add embedded objects. By passing a value to embedded objects, you can write MY_SCOPE_NAME__MY_VARIABLEN_NAME.
The scope name and value is splitted by double underscore ( _ ).
Defaults values for embedded objects do not work well. For this we let stay alive the default.json.

### ./config/default.json

Is stay alive and only used for *default values of embedded objects* in default.schema.json.
The values should be the same like in default.schema.json are added as default values. (means production values)

### ./config/development.json

This file override default.json and default.schema.json values.
It is used for local development.
For example it increase the timeouts for enable us to debug stuff.

> Please look to "local setups" topic on this page, if you only want to add your personal settings.

### ./config/test.json

This file override default.json and default.schema.json values.
It is used for test executions. (NODE_ENV==='test')
For example to reduce log outputs.
> Please carful any change effects all tests in this repository.

For test we can also use injections of the nestjs configuration module, or service to set values for a special test.

> Please look to featherJS test examples or nestjs test examples in this file for configurations that should only effects single tests.

### auto deployment (overriding and setting additional values)

We have 2 sources that can fullfill and add envirements.
The one is our auto deployment repository that can set envirment values directly over config.jsons.
The other source fetch secrets for .dev systems from gitHub, or 1password for productions.

We only add values to it if we need them. Do we want the default values from default.schema.json,
on all production like systems (dev, ref, production), it should not add to configurations in autodeployment.
> Over this way we can reduce the total amount of envirement values in production pods.

<https://github.com/hpi-schul-cloud/dof_app_deploy/blob/main/ansible/group_vars/all/config.yml>

> For documentation how it is work, plase look to our confluence. No github documentation exist atm.

### nestjs configuration module

#### setup configuration interfaces

<https://docs.nestjs.com/techniques/configuration>

We implement a solution that based on nestjs and combined it with the parsing from the @hpi-schul-cloud/commons of the existing config files.
In future we want to replace it with a nestjs only solution.

Any module that need configuration, can define his need by creating a interface file with the schema I*MY_NAME*Config.
In first step we add this interfaces directly to a app config file with extends ...,I*MY_NAME*Config,...,.. .
The combined Iconfig interface can be used to initilized the nestjs configuration module.
The nestjs configuration module is defined global in the hole app and can be used over injections.

> We force over this way, that modules can be defined the needs.
> We only have a single point, where all envirements are added to our application.
> We can easy replace this solution with a nestjs parser instead, of Configuration from @hpi-schul-cloud/commons in future.

This code show a minimal flow.

``` javascript
    // needed configuration for a module
    export interface IUserConfig {
        AVAILABLE_LANGUAGES: string[];
    }

    // server.config.ts
    export interface IServerConfig extends ICoreModuleConfig, IUserConfig, IFilesStorageClientConfig {
        NODE_ENV: string;
    }

    // server.module.ts
    import { Module } from '@nestjs/common';
    import { ConfigModule } from '@nestjs/config';
    import serverConfig from './server.config';

    const serverModules = [
        ConfigModule.forRoot({
            isGlobal: true,
            validationOptions: { infer: true },
            load: [serverConfig],
        })
    ]

    @Module({
        imports: [...serverModules],
    })
    export class ServerModule {}

    //use via injections
    import { ConfigService } from '@nestjs/config';
    import { IUserConfig } from '../interfaces';

    constructor(private readonly configService: ConfigService<IUserConfig, true>){}

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

        before(async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: ConfigService,
                        useValue: createMock<ConfigService>(),
                    },
                ],
            }).compile();

            config = module.get(ConfigService);
        });

        it('XXX', () => {
            config.get.mockReturnValue(['value']);
        })

        after(() => {
            config.get.mockRestore();
        })

    });

```

Mocking in api (.e2e) tests.
> A better solution based on nestjs configuration module must be figure out and implement.
> Please feel free to improve this part and documentation.

``` javascript
    import { Configuration } from '@hpi-schul-cloud/commons';
    import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';

    const configBefore: IConfig = Configuration.toObject({ plainSecrets: true });
    Configuration.set('MY_ENVIREMENT_VARIABLE', 'value');

    // eslint-disable-next-line import/first
    import { ServerTestModule } from '@src/server.module';

    describe('XXX', () => {

        beforeEach(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [ServerTestModule],
            }).compile();
        })

        afterAll(async () => {
            Configuration.reset(configBefore);
        });

    });
```

### special cases in nestjs

If we want to use values in decorators, we can not use the nestjs configuration module.
The parsing of decorators in file start first and after it the injections are solved.

It is possible to import the config file of the application directly and used the values.

``` javascript
    import serverConfig from '@src/server.config';

    @RequestTimeout(serverConfig().INCOMING_REQUEST_TIMEOUT_COPY_API)
```

## Passing configuration to vue client

It exist a endpoint that expose envirment values.
This values are used by the vue client.
The solution is the only existing way how envirments should pass to the new vue client.

Please carful! Secrets should never exposed!
They are readable in brower and request response.

<https://github.com/hpi-schul-cloud/schulcloud-server/blob/main/src/services/config/publicAppConfigService.js#L14>

<http://{{HOST}}:{{PORT}}/api/v1/docs/config/app/public>
<http://{{HOST}}:{{PORT}}/api/v1/config/app/public>

> The public config endpoint should move to v3/ stack in future.

## desired changes in future

We want to remove the different config files and the Configuration from @hpi-schul-cloud/commons package.
We want to use the nestjs solutions over parsing configuration values for different states.
This result in a new format for the default.schema.json file.

We also want to put more envirments values to database, to enable us to switching it without redeploys over our dashboard.

## local setups

You can use the .env convention to set settings that only work for you locally.
For temporary checks you can add envirements to you terminal based on the solution of your IOS.
You can also add envirements for debugging, or if you run your applications over .vscode/lunch.json with:

``` json
    "env": {
        "NODE_ENV": "test"
    }
```
