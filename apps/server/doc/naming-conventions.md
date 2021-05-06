# Naming conventions

In TypeScript files: for Classes we use PascalCase (names start with uppercase letter), variables use lowercase for the first letter (camelCase).

When assigning names, they may end with a concept name:

- A Concept might be a known term which is widely used. Samples from NestJS: Controller,Provider, Module, Middleware, Exception, Pipe, Guard, Interceptor. 

- Beside we have own concepts like comparator, validator, repo, service, ... which should all not be part of a modules (and located in shared folder btw).

In file names, we use lowercase and minus in the beginning and end with .concept.ts

## Samples

| File name               | Class name        | Concept    | Location               |
|-------------------------|-------------------|------------|------------------------|
| login-user.uc.ts        | LoginUserUc       | use case   | module/uc              |
| text.validator.ts       | TextValidator     | validator  | shared/core/validators |
| user.repo.ts            | UserRepo          | repository | module/repo            |
| parse-object-id.pipe.ts | ParseObjectIdPipe | pipe       | shared/core/pipes      |

## File structure

The server app located in `/apps/server` is structured like. Beside each ts-file, a test file *.spec.ts has to be added for unit tests (hidden for simplification). Use index.ts files that combine a folders content and export all files from within of the folder using `export * from './file'`. When there are naming conflict, use more specific names.

```
src/ // sourcecode & unit tests
 - config/  // for global definitions
 - modules/ // for your NestJS modules
   - [module] // where [module] could be like user, homework, school
     - domain/
       - <entity>.entity.ts // (where <entity> might be a user, news, ... owned by the module) exports entity class & document type
     - dto/ // dto's define api in/out types as a class with annotations
       - <action-param>.dto.ts // (like create-user.dto.ts)
     - repo/ // repositories
        - schema/ // contains schema imports from legacy app or new definitions
            - <entity>.schema.ts // exports (legacy-) mongoose schemas
        - <entity>.repo.ts // where entity might be user, news, school
     - services/ // Not really needed, write use cases instead
        - <module>.service.ts // the modules main service file, might be exported
        - other.service.ts // but prefere a use case instead
     - uc/
        - <login-user>.uc.ts // one file per single use case (use a long name)
     - <module>.controller.ts // defines rest api, references main service file
     - <module>.module.ts // DI instructions to build the module
 - shared/ // reused stuff without module ownership 
   - core/ // shared concepts (decorators, pipes, guards, errors, ...) folders might be added
   - domain // (abstract) domain base entities which will be extended in the modules
   - utils/ // helpers, tools, utils can be located here (but find a better name)
test/ // e2e tests against controllers should use same folder names like controllers

```

For concepts (see https://docs.nestjs.com/first-steps) of NestJS put implementations in shared/core. You might use shared/utils for own solutions, assume TextUtils but when it contains text validators, move it better to shared/core/validators/text.validator.ts before merge. The core concepts of NestJS can be extended with ours (like repo).
