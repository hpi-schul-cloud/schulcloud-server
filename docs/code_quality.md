# Code Quality Agreements

## Intro

This document provides some guides how to implement functionality. Every developer should be aware of these "code
quality agreements" and follow it. One key objective is to develop a homogeneous. stable code base.

## Closures/Arrow functions

Use whenever possible arrow functions. If you ever try to access the context of the function you're in
through ```this``` stop your work! Sit back and rethink about what you are trying to do. There may be a better solution.
Grab a coffee and talk to another team mate.\

```javascript
// wrong
function doSomething() {
}


// right
const doSomething = () => {
}
```

## async/await over promises or callback

Use ```async/await``` instead of promises or even callbacks. Nearly every framework oder library is able to recognize
promises and process them correctly. Use ```try/catch/throw``` to control the execution.

```javascript
// wrong
return () => {
    return doSomethingAsync()
            .then((result) => {
                return result;
            })
            .catch((e) => {
                return e;
            })
}

// right
return async () => {
    try {
        return await doSomethingAsync();
    } catch (e) {
        throw e;
    }
}
```

## http status codes
Especially when you return (throw) am error, think about what went wrong and return the matching http status code (https://en.wikipedia.org/wiki/List_of_HTTP_status_codes).
The library `@feathersjs/errors` will help you.

## feathers hooks
Use feathers hooks whenever you have to alter/enrich incoming or outgoing data. Put security and permission checks at
the beginning of the hooks chain. Abort early!
Never retrieve data from the db and filter it in a after hook depending on permission of the requesting user. Mistakes
will result in a security breach!
Feathers can handle async hooks. Use it!
Hook functions always return their incoming context!!!

```javascript
const myHook = async (context) => {
    try {
        const { app, params } = context;
        context.params.currentUser = await app.service('/users').get(params.userId);
        return context;
    } catch (e) {
        
    }
}
```

## feathers-hooks-common
Do not reinvent the wheel. We use the library `feathers-hooks-common` (https://hooks-common.feathersjs.com/overview.html) which includes implementations of many very common use cases. 

## Improvements
### Do not force a hook/service method to be async
```javascript
// Don't
exports.isAdmin = () => (context) => {
    if (!(context.params.user.permissions || []).includes('ADMIN')) {
        throw new Forbidden('you are not an administrator');
    }

    return Promise.resolve(context); // with this line you force a hook to be async but it don't have to
};

// better
exports.isAdmin = (context) => {
    if (!(context.params.user.permissions || []).includes('ADMIN')) {
        throw new Forbidden('you are not an administrator');
    }
    return context;
};
```

### Bear in mind: implicit array functions do not wait for promises/async work
Implicit Array function (`.map()`, `.foreach()`, ...) will not wait for any async function call within the loop to finish before executing the next iteration.

### Executing last callback before others are able to finish
Seen many times in tests:
```javascript
after((done) => {
    testObjects.cleanup();
    server.close(done);
})
```
What's the problem: `testObjects.cleanup()` is async. It hides the execution of (many) promises within it. This can last some time.
When the `server` finishes to tear down the final callback `done` is called and the test will be terminated. In this situation it is not defined and not predictable what happens to the internal running promises.
Most of the time the internal promises will get terminated with the effect that test objects/entities will not get cleaned up.
This may effect other tests.
```javascript
// better
after(async () => {
    await testObjects.cleanup();
    await server.close();
})
```

### Avoid multiple before/after functions
One `describe` block should only have one `before` and/or one `after` function.

### Follow few implementation templates/patterns
For such a big project with many contributors it is vital to use few and well known patterns and implementation styles.
This is a fact of maintainablity. The more different coding styles are used the harder it is for others to follow your implementation.
Don't use every technology/implementation pattern your are aware of. The use of such should be an common agreement.

### Memory consumption/pagination
`mongoose` is used as abstraction layer to the underlying MongoDB. Be aware that there is a default value (`limit`) when querying for entries: 25!
Of course this value can be altered. But this might not be your best option.<br>
Example: `query: {"$limit": 1000}`<br>
With this query 1000 objects will get loaded into the memory. For one request this might be ok, but there can be many other requests doing exact the same at the same time.
In some situations it will be better to switch over to native queries (`app.service(...).find()`, `app.service(...).aggregate()`) and use `cursors`.
