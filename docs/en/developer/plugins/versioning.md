# Versions and compatibility

**Status:** Proposed policy. v0.2 is not declared stable.

A server release, a plugin release, and a component interface version describe different things. Keeping them distinct lets Pumpkin update its implementation without forcing every plugin to rebuild, while still rejecting incompatible components before they become active.

## What a version identifies

| Version | What it identifies |
| --- | --- |
| Pumpkin release | The server and the contracts it supports |
| WIT package | Component function, type, resource, and behavioral contracts |
| Language SDK | Authoring helpers and generated bindings for specified contracts |
| Plugin package | A provider implementation and its configuration format |
| Third-party interface | A service or extension contract owned by its publisher |
| Runtime/toolchain dependency | Wasmtime, WASI support, and binding-generation behavior |

For example, an economy plugin can fix its accounting implementation without changing its `accounts` interface. Its plugin release changes, while consumers can keep using the same interface contract.

Upgrading Wasmtime needs validation that existing components keep their supported execution behavior, but not necessarily a new WIT version. The runtime dependency version does not select the plugin ABI.

## Reading WIT versions

A WIT identity such as `example:ledger/accounts@1.0.0` names an interface in a versioned package. Consumers compile against the contract and providers implement it. The loader checks both the identity and the actual component types.

A plugin's own `metadata.version` describes its release. It cannot select the Pumpkin ABI or override a mismatch in its real imports and exports.

The current version-prefix check can select a host implementation family. That is only one loading step. Actual imports, exports, resource mappings, required features, and supported calling conventions still have to resolve.

## Evolving a contract

Compatibility has a direction. Adding a host function can preserve older consumers, but a new consumer that calls it needs a provider that supplies it. Adding a required plugin callback can break existing plugin implementations.

Existing types require equal care. Changing fields, variant cases, resource identity, or own/borrow semantics can invalidate callers even if the change looks additive in source. Changing delivery order or expiry behavior can break plugins without changing a function signature at all.

Use WIT's `@since`, `@unstable`, and deprecation annotations where the selected toolchains support them. An annotation records intended availability; it does not replace compatibility checking. The [WIT feature-gate specification](https://github.com/WebAssembly/component-model/blob/main/design/mvp/WIT.md#feature-gates) describes their semantics.

Experimental features remain opt-in. Stable contracts should describe state interleaving from their first release, rather than allowing authors to rely on accidental global serialization and removing it later.

## Stabilizing the async API

v0.2 names the async API generation under development, so incompatible revisions cannot all ship as the same `0.2.0` artifact, and released package contents are immutable. [ADR 0005](./decisions/0005-contract-versioning) proposes the pre-1.0 numbering. After stabilization, [Semantic Versioning](https://semver.org/spec/v2.0.0.html) applies: a major version for incompatible changes, a minor version for compatible additions, and a patch for compatible fixes.

## SDK source and component binaries

A language SDK has its own source API. Renaming a Rust helper can require source changes even when it emits the same component interface. Conversely, a binding generator can change the calling convention without changing the WIT text.

An SDK release therefore records the exact WIT and toolchain revisions it uses. Compatibility tests retain components built by released SDKs. Rebuilding every fixture with the newest bindings can hide a regression affecting plugins already distributed to users.

Wasm bytecode and Wasmtime-specific compiled output also have different portability requirements. Compiled output is a cache tied to its runtime and configuration, not a substitute for the component's portable artifact and declared contract.

## Deprecation and support

Each server release publishes its supported interfaces, component features, and relevant execution requirements.

A release supports the contract series current at its release and the one before it. Removing a series needs one release of notice and a migration path, and happens no sooner than two releases after the first release whose SDKs cover every supported language ([ADR 0005](./decisions/0005-contract-versioning)). Retiring v0.1 also needs the [migration criteria](./migration).

Future interface adapters can share the same async runtime. Supporting an earlier contract does not automatically require restoring a historical scheduler or engine mode. Physical region IDs, queue algorithms, and worker placement stay internal unless the public contract genuinely requires them.
