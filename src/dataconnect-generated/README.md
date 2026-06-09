# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetAllPublicLists*](#getallpubliclists)
  - [*MyWatchedMovies*](#mywatchedmovies)
- [**Mutations**](#mutations)
  - [*CreateMovie*](#createmovie)
  - [*AddMovieReview*](#addmoviereview)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetAllPublicLists
You can execute the `GetAllPublicLists` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAllPublicLists(options?: ExecuteQueryOptions): QueryPromise<GetAllPublicListsData, undefined>;

interface GetAllPublicListsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAllPublicListsData, undefined>;
}
export const getAllPublicListsRef: GetAllPublicListsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAllPublicLists(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetAllPublicListsData, undefined>;

interface GetAllPublicListsRef {
  ...
  (dc: DataConnect): QueryRef<GetAllPublicListsData, undefined>;
}
export const getAllPublicListsRef: GetAllPublicListsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAllPublicListsRef:
```typescript
const name = getAllPublicListsRef.operationName;
console.log(name);
```

### Variables
The `GetAllPublicLists` query has no variables.
### Return Type
Recall that executing the `GetAllPublicLists` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAllPublicListsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetAllPublicListsData {
  lists: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    user: {
      displayName: string;
    };
  } & List_Key)[];
}
```
### Using `GetAllPublicLists`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAllPublicLists } from '@dataconnect/generated';


// Call the `getAllPublicLists()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAllPublicLists();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAllPublicLists(dataConnect);

console.log(data.lists);

// Or, you can use the `Promise` API.
getAllPublicLists().then((response) => {
  const data = response.data;
  console.log(data.lists);
});
```

### Using `GetAllPublicLists`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAllPublicListsRef } from '@dataconnect/generated';


// Call the `getAllPublicListsRef()` function to get a reference to the query.
const ref = getAllPublicListsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAllPublicListsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.lists);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.lists);
});
```

## MyWatchedMovies
You can execute the `MyWatchedMovies` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
myWatchedMovies(options?: ExecuteQueryOptions): QueryPromise<MyWatchedMoviesData, undefined>;

interface MyWatchedMoviesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<MyWatchedMoviesData, undefined>;
}
export const myWatchedMoviesRef: MyWatchedMoviesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
myWatchedMovies(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<MyWatchedMoviesData, undefined>;

interface MyWatchedMoviesRef {
  ...
  (dc: DataConnect): QueryRef<MyWatchedMoviesData, undefined>;
}
export const myWatchedMoviesRef: MyWatchedMoviesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the myWatchedMoviesRef:
```typescript
const name = myWatchedMoviesRef.operationName;
console.log(name);
```

### Variables
The `MyWatchedMovies` query has no variables.
### Return Type
Recall that executing the `MyWatchedMovies` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MyWatchedMoviesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface MyWatchedMoviesData {
  watches: ({
    watchDate: DateString;
    movie: {
      title: string;
      year: number;
    };
  })[];
}
```
### Using `MyWatchedMovies`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, myWatchedMovies } from '@dataconnect/generated';


// Call the `myWatchedMovies()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await myWatchedMovies();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await myWatchedMovies(dataConnect);

console.log(data.watches);

// Or, you can use the `Promise` API.
myWatchedMovies().then((response) => {
  const data = response.data;
  console.log(data.watches);
});
```

### Using `MyWatchedMovies`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, myWatchedMoviesRef } from '@dataconnect/generated';


// Call the `myWatchedMoviesRef()` function to get a reference to the query.
const ref = myWatchedMoviesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = myWatchedMoviesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.watches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.watches);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateMovie
You can execute the `CreateMovie` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMovie(vars: CreateMovieVariables): MutationPromise<CreateMovieData, CreateMovieVariables>;

interface CreateMovieRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMovieVariables): MutationRef<CreateMovieData, CreateMovieVariables>;
}
export const createMovieRef: CreateMovieRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMovie(dc: DataConnect, vars: CreateMovieVariables): MutationPromise<CreateMovieData, CreateMovieVariables>;

interface CreateMovieRef {
  ...
  (dc: DataConnect, vars: CreateMovieVariables): MutationRef<CreateMovieData, CreateMovieVariables>;
}
export const createMovieRef: CreateMovieRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMovieRef:
```typescript
const name = createMovieRef.operationName;
console.log(name);
```

### Variables
The `CreateMovie` mutation requires an argument of type `CreateMovieVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateMovieVariables {
  title: string;
  year: number;
  summary?: string | null;
  genres?: string[] | null;
  runtime?: number | null;
}
```
### Return Type
Recall that executing the `CreateMovie` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMovieData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMovieData {
  movie_insert: Movie_Key;
}
```
### Using `CreateMovie`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMovie, CreateMovieVariables } from '@dataconnect/generated';

// The `CreateMovie` mutation requires an argument of type `CreateMovieVariables`:
const createMovieVars: CreateMovieVariables = {
  title: ..., 
  year: ..., 
  summary: ..., // optional
  genres: ..., // optional
  runtime: ..., // optional
};

// Call the `createMovie()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMovie(createMovieVars);
// Variables can be defined inline as well.
const { data } = await createMovie({ title: ..., year: ..., summary: ..., genres: ..., runtime: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMovie(dataConnect, createMovieVars);

console.log(data.movie_insert);

// Or, you can use the `Promise` API.
createMovie(createMovieVars).then((response) => {
  const data = response.data;
  console.log(data.movie_insert);
});
```

### Using `CreateMovie`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMovieRef, CreateMovieVariables } from '@dataconnect/generated';

// The `CreateMovie` mutation requires an argument of type `CreateMovieVariables`:
const createMovieVars: CreateMovieVariables = {
  title: ..., 
  year: ..., 
  summary: ..., // optional
  genres: ..., // optional
  runtime: ..., // optional
};

// Call the `createMovieRef()` function to get a reference to the mutation.
const ref = createMovieRef(createMovieVars);
// Variables can be defined inline as well.
const ref = createMovieRef({ title: ..., year: ..., summary: ..., genres: ..., runtime: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMovieRef(dataConnect, createMovieVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.movie_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.movie_insert);
});
```

## AddMovieReview
You can execute the `AddMovieReview` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addMovieReview(vars: AddMovieReviewVariables): MutationPromise<AddMovieReviewData, AddMovieReviewVariables>;

interface AddMovieReviewRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddMovieReviewVariables): MutationRef<AddMovieReviewData, AddMovieReviewVariables>;
}
export const addMovieReviewRef: AddMovieReviewRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addMovieReview(dc: DataConnect, vars: AddMovieReviewVariables): MutationPromise<AddMovieReviewData, AddMovieReviewVariables>;

interface AddMovieReviewRef {
  ...
  (dc: DataConnect, vars: AddMovieReviewVariables): MutationRef<AddMovieReviewData, AddMovieReviewVariables>;
}
export const addMovieReviewRef: AddMovieReviewRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addMovieReviewRef:
```typescript
const name = addMovieReviewRef.operationName;
console.log(name);
```

### Variables
The `AddMovieReview` mutation requires an argument of type `AddMovieReviewVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddMovieReviewVariables {
  movieId: UUIDString;
  watchId: UUIDString;
  rating: number;
  reviewText?: string | null;
  isPublic?: boolean | null;
}
```
### Return Type
Recall that executing the `AddMovieReview` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddMovieReviewData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddMovieReviewData {
  review_insert: Review_Key;
}
```
### Using `AddMovieReview`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addMovieReview, AddMovieReviewVariables } from '@dataconnect/generated';

// The `AddMovieReview` mutation requires an argument of type `AddMovieReviewVariables`:
const addMovieReviewVars: AddMovieReviewVariables = {
  movieId: ..., 
  watchId: ..., 
  rating: ..., 
  reviewText: ..., // optional
  isPublic: ..., // optional
};

// Call the `addMovieReview()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addMovieReview(addMovieReviewVars);
// Variables can be defined inline as well.
const { data } = await addMovieReview({ movieId: ..., watchId: ..., rating: ..., reviewText: ..., isPublic: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addMovieReview(dataConnect, addMovieReviewVars);

console.log(data.review_insert);

// Or, you can use the `Promise` API.
addMovieReview(addMovieReviewVars).then((response) => {
  const data = response.data;
  console.log(data.review_insert);
});
```

### Using `AddMovieReview`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addMovieReviewRef, AddMovieReviewVariables } from '@dataconnect/generated';

// The `AddMovieReview` mutation requires an argument of type `AddMovieReviewVariables`:
const addMovieReviewVars: AddMovieReviewVariables = {
  movieId: ..., 
  watchId: ..., 
  rating: ..., 
  reviewText: ..., // optional
  isPublic: ..., // optional
};

// Call the `addMovieReviewRef()` function to get a reference to the mutation.
const ref = addMovieReviewRef(addMovieReviewVars);
// Variables can be defined inline as well.
const ref = addMovieReviewRef({ movieId: ..., watchId: ..., rating: ..., reviewText: ..., isPublic: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addMovieReviewRef(dataConnect, addMovieReviewVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.review_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.review_insert);
});
```

