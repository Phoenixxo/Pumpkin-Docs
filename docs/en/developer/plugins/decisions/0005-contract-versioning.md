# 0005: Version contracts independently of runtime releases

**Status:** Proposed. **Date:** 2026-10-28.

## Context

Server releases, SDK source APIs, WIT contracts, plugin implementations, and Wasmtime dependencies change for different reasons, and a version-prefix match cannot prove interface compatibility or supported execution behavior.

## Decision

Version public contracts explicitly and publish immutable artifacts. Record the WIT and binding/toolchain revisions used by SDKs. Classify compatibility by function types, resource semantics, and observable behavior. Test released binaries rather than only rebuilding examples with the latest SDK.

**Numbering:** Treat v0.2 as a development generation. `0.2.z` carries only compatible changes. A stable `1.0.0` marks the public commitment once execution, ownership, and event semantics settle. Semantic Versioning allows instability in major version zero, so this policy takes effect when the maintainers adopt this record.

**Break boundary:** Within a development series, compatible changes are added host functions and types, and fixes that bring behavior in line with the documented contract. Changing a function signature, a record field, a variant case, resource identity, own/borrow semantics, delivery order, or expiry behavior starts a new series (`0.3.0`).

**Release window:** A server release supports the contract series current at its release and the one before it. A series is removed no sooner than two server releases after the first release whose SDKs cover every supported language, and the release before removal announces it.

**Deprecation notice:** Removing any supported contract needs one release of notice that names the replacement and the migration path.

**Experimental features:** An `@unstable` feature appears in a language's SDK only if that language's binding generator enforces the feature gate, and using it needs explicit opt-in. Every added or removed item carries `@since` or `@deprecated`, and compatibility tests check them.

## Alternatives

Lockstep numbering turns internal upgrades into plugin releases. An indefinitely changing package under one version prevents reproducible linking. Permanent support for every historical runtime architecture obscures migration costs.

## Consequences

A release needs an explicit supported-contract matrix and feature-enabled validation. Future old-contract adapters can use the same async runtime, so contract evolution does not require another execution generation.

See [versioning](../versioning) and [migration](../migration).
