# codegen-apollo-bare-client

[GraphQL Code Generator](https://graphql-code-generator.com/) plugin for bare [Apollo client](https://github.com/apollographql/apollo-client) operations with **full type-safety**.

With support for all: `query`, `mutation` and `subscription` :tada:

> Made for @apollo/client v3

## Install

```sh
npm i codegen-apollo-bare-client
# or
yarn add codegen-apollo-bare-client
```

> Install these if you don't already have them
> `@graphql-codegen/cli` `@graphql-codegen/typescript` `@graphql-codegen/typescript-operations`

## Usage

Inside your `codegen.yaml`, for example:

```yaml
schema: schema.gql
documents: src/graphql/*.gql
generates:
  src/graphql/index.ts:
    plugins:
      - typescript
      - typescript-operations
      - codegen-apollo-bare-client
    config:
      # REQUIRED
      apolloClientImport: 'import { client } from "../apolloClient"'
      # "apolloClientName" is optional, by default looks for "client"
      # Just make sure it's the same name as in the import
      apolloClientName: client
# Optional prettier usage
hooks:
  afterAllFileWrite:
    - prettier --write src/graphql/*
```

And if you have for example:

```graphql
query posts($limit: Int!) {
  posts(limit: $limit) {
    title
    body
  }
}
```

Reusing the `typescript` and `typescript-operations` generated code, it will generate functions like these:

```ts
export const postsClientQuery = (
  opts: Omit<QueryOptions<PostsQueryVariables>, "query"> & {
    variables: PostsQueryVariables;
  }
) => {
  return client.query<PostsQuery, PostsQueryVariables>({
    query: PostsDocument,
    ...opts,
  });
};
```
