# 0004: Link components through published contracts

**Status:** Proposed. **Date:** 2026-10-28.

## Context

Libraries and extensions need reusable functionality without sharing arbitrary memory across languages. Byte-message IPC supplies no typed service discovery or resource lifetimes.

## Decision

Use published WIT contracts for consumers and providers. Resolve installed dependencies before activation. Keep packaging, interface version, live instance, authority, and execution domain distinct.

An extension point discovers implementations of a known contract. A shared service has explicit state and lifetime semantics. The runtime may use dynamic values internally while guests keep generated typed bindings.

**Supported types:** The resolver initially accepts primitives (`bool`, the integer and float types, `char`, `string`), `list`, `option`, `result`, `tuple`, `record`, `variant`, `enum`, `flags`, and owned or borrowed resources through proxies. `stream` and `future` are not supported, and an interface that uses them fails resolution before activation.

**Extension resource identity:** A resource type is identified by its package, interface, resource name, and compatible version. The parent declares the extension interface it accepts, and the host discovers providers by that exact identity. Two providers that export resources with the same name from different interfaces produce distinct types. A proxy records the provider instance, its generation, the local entry identity, the consumer-visible resource type, and the ownership obligation.

**Provider revocation:** The host revokes a retained resource only if the interface can express a provider-unavailable result for it. For any other interface, retirement waits until dependents drain. If retirement is forced, the host stops the dependent components, last dependent first, instead of promising transparent hot unload.

## Alternatives

A universal `invoke(name, bytes)` interface loses existing type and resource contracts. A private composed library suits cases that need no independent installation or lifecycle, but it cannot cover every shared-service or extension use case. Composition and separate-store host routing also differ in execution and retirement boundaries (see [lifecycle and linking](../lifecycle-and-linking#private-libraries-and-shared-services)).

## Consequences

Generic routing needs type mapping, resource proxies, ownership and destructor handling, invocation propagation, and retirement behavior for every supported type. Streams and futures need additional transport support before they can be added to the list. Shared engine reuse can help but is not required for all host-mediated forwarding.

See [lifecycle and linking](../lifecycle-and-linking).
