import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddMovieReviewData {
  review_insert: Review_Key;
}

export interface AddMovieReviewVariables {
  movieId: UUIDString;
  watchId: UUIDString;
  rating: number;
  reviewText?: string | null;
  isPublic?: boolean | null;
}

export interface CreateMovieData {
  movie_insert: Movie_Key;
}

export interface CreateMovieVariables {
  title: string;
  year: number;
  summary?: string | null;
  genres?: string[] | null;
  runtime?: number | null;
}

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

export interface ListMovie_Key {
  listId: UUIDString;
  movieId: UUIDString;
  __typename?: 'ListMovie_Key';
}

export interface List_Key {
  id: UUIDString;
  __typename?: 'List_Key';
}

export interface Movie_Key {
  id: UUIDString;
  __typename?: 'Movie_Key';
}

export interface MyWatchedMoviesData {
  watches: ({
    watchDate: DateString;
    movie: {
      title: string;
      year: number;
    };
  })[];
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface Watch_Key {
  id: UUIDString;
  __typename?: 'Watch_Key';
}

interface CreateMovieRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMovieVariables): MutationRef<CreateMovieData, CreateMovieVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateMovieVariables): MutationRef<CreateMovieData, CreateMovieVariables>;
  operationName: string;
}
export const createMovieRef: CreateMovieRef;

export function createMovie(vars: CreateMovieVariables): MutationPromise<CreateMovieData, CreateMovieVariables>;
export function createMovie(dc: DataConnect, vars: CreateMovieVariables): MutationPromise<CreateMovieData, CreateMovieVariables>;

interface GetAllPublicListsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAllPublicListsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetAllPublicListsData, undefined>;
  operationName: string;
}
export const getAllPublicListsRef: GetAllPublicListsRef;

export function getAllPublicLists(options?: ExecuteQueryOptions): QueryPromise<GetAllPublicListsData, undefined>;
export function getAllPublicLists(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetAllPublicListsData, undefined>;

interface MyWatchedMoviesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<MyWatchedMoviesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<MyWatchedMoviesData, undefined>;
  operationName: string;
}
export const myWatchedMoviesRef: MyWatchedMoviesRef;

export function myWatchedMovies(options?: ExecuteQueryOptions): QueryPromise<MyWatchedMoviesData, undefined>;
export function myWatchedMovies(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<MyWatchedMoviesData, undefined>;

interface AddMovieReviewRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddMovieReviewVariables): MutationRef<AddMovieReviewData, AddMovieReviewVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddMovieReviewVariables): MutationRef<AddMovieReviewData, AddMovieReviewVariables>;
  operationName: string;
}
export const addMovieReviewRef: AddMovieReviewRef;

export function addMovieReview(vars: AddMovieReviewVariables): MutationPromise<AddMovieReviewData, AddMovieReviewVariables>;
export function addMovieReview(dc: DataConnect, vars: AddMovieReviewVariables): MutationPromise<AddMovieReviewData, AddMovieReviewVariables>;

