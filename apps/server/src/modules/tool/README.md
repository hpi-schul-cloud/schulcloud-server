# Tool Module - under construction

## Description

This module has the purpose of handling configurable tools.

We have three layers of tools: External, SchoolExternal and ContextExternal tools.

The **external tools** are tools that are configured by a superhero for the whole instance.
External tools have a configu which define if it is an oauth2, lti or a basic tool.

The **school external tools** are tools that are configured by a school admin for a specific school and are a subset of the
external tools.

The **context external tools** are tools that are configured by a teacher for a specific context and are a subset of the
school external tools. At the moment only courses are supported as context.


The whole architecture can be found in confluence [here](https://docs.dbildungscloud.de/x/RwKLDQ) module.

## Exports

The module exports the following services, which can be used outside the module.

_Please remember that the service itself does not check whether it is a validated domain object or not._

- ExternalToolService
- ExternalToolValidationService

- SchoolExternalToolService
- SchoolExternalToolValidationService

- ContextExternalToolService
- ContextExternalToolValidationService

- CommonToolValidationService
- CommonToolService
- ToolLaunchService

- ToolFeatures
- ExternalToolRepoMapper

## Structure

```
tool
├───common
├───external-tool
├───school-external-tool
├───context-external-tool
├───tool-launch
```


