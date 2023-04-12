# Code Style

## Function

### Naming

The name of a function should clearly communicate what it does. There should be no need to read the implementation of a function to understand what it does.

There are a few keywords that we use with specific meaning:

#### is...

`isTask()`, `isPublished()`, `isAuthenticated()`, `isValid()`

A function with the prefix "is..." is checking wether the input belongs to a certain (sub)class, or fulfils a specific criteria.

The function should return a boolean, and have no sideeffects.

#### check...

`checkIsAuthorized()`, `checkInputIsValid()`

A function with the prefix "check..." is checking the condition described in its name, throwing an error if it does not apply.

#### has...

`hasPermission()`,

similar to "is...", the prefix "has..." means that the function is checking a condition, and returns a boolean. It does NOT throw an error.

## Classes

### Order of declarations

Classes are declared in the following order:
1. properties
2. constructor
3. methods

Example:
```Typescript
export class Course {
  // 1. properties
  name: string;
  
  // more properties...

  // 2. constructor
  constructor(props: { name: string }) {
    // ...
  }

  // 3. methods
  getShortTitle(): string {
    // ...
  }

  // more methods...
}
```
