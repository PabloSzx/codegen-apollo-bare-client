import type { PluginFunction, PluginValidateFn } from "@graphql-codegen/plugin-helpers";
import type { OperationTypeNode } from "graphql";

type PluginConfig = { apolloClientName?: string; apolloClientImport: string };

type Operation = {
  name: string;
  nameUppercase: string;
  operation: OperationTypeNode;
  hasVariables: boolean;
};

const IsOperation = (v: Operation | null): v is Operation => {
  return v != null;
};

export const plugin: PluginFunction<PluginConfig> = async (_schema, documents, config, _info) => {
  const firstLetterUppercase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  const operations = documents
    .flatMap(({ document }) => {
      const defs = document?.definitions;
      if (defs) {
        return defs
          .map((def) => {
            if (def.kind === "OperationDefinition") {
              if (def.name) {
                return {
                  name: def.name.value,
                  nameUppercase: firstLetterUppercase(def.name.value),
                  operation: def.operation,
                  hasVariables: !!def.variableDefinitions?.length,
                };
              }
            }
            return null;
          })
          .filter(IsOperation);
      }

      return null;
    })
    .filter(IsOperation);

  const importClient = config.apolloClientImport;
  const clientName = config.apolloClientName || "client";
  const ApolloTypes = `import type { QueryBaseOptions, MutationOptions, SubscriptionOptions } from "@apollo/client";`;

  return {
    prepend: [importClient, ApolloTypes],
    content: `
      ${operations
        .map(({ name, nameUppercase, operation, hasVariables }) => {
          const operationUppercase = firstLetterUppercase(operation);
          const nameWithOperation = nameUppercase + operationUppercase;

          const variablesType = hasVariables ? nameWithOperation + "Variables" : "never";

          switch (operation) {
            case "query": {
              return `
              export const ${name}ClientQuery = (opts: Omit<QueryBaseOptions<${variablesType}>, "query"> & { variables: ${variablesType} }) => {
                return ${clientName}.query<${nameWithOperation}, ${variablesType}>({
                  query: ${nameUppercase}Document,
                  ...opts
                })
              }
            
            `;
            }
            case "mutation": {
              return `
              export const ${name}ClientMutation = (opts: Omit<MutationOptions<${nameWithOperation},${variablesType}>, "mutation"> & { variables: ${variablesType} }) => {
                return ${clientName}.mutate<${nameWithOperation}, ${variablesType}>({
                  mutation: ${nameUppercase}Document,
                  ...opts
                })
              }
            `;
            }
            case "subscription": {
              return `
              export const ${name}ClientSubscribe = (opts: Omit<SubscriptionOptions<${variablesType}>, "query"> & { variables: ${variablesType} }) => {
                return ${clientName}.subscribe<${nameWithOperation}, ${variablesType}>({
                  query: ${nameUppercase}Document,
                  ...opts
                })
              }
            `;
            }
          }
        })
        .map((op) =>
          op
            .split("\n")
            .map((v) => v.trim())
            .join(" ")
            .trim()
        )
        .join("\n")}
    `,
  };
};

export const validate: PluginValidateFn<PluginConfig> = (
  _schema,
  _documents,
  config,
  _outputFile,
  allPlugins
) => {
  if (!config.apolloClientImport) {
    throw Error(`You must specify "apolloClientImport" in your plugin configuration.`);
  }

  if (!allPlugins.find((v) => Object.keys(v).includes("typescript"))) {
    throw Error(`You must specify the "typescript" plugin in your configuration.`);
  }

  if (!allPlugins.find((v) => Object.keys(v).includes("typescript-operations"))) {
    throw Error(`You must specify the "typescript" plugin in your configuration.`);
  }
};
