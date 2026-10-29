# Interfaces and resources

**Status:** Host resources for server objects exist. Provider resolution and cross-store forwarding are proposed. See [implementation status](./implementation-status).

Components interact through interfaces rather than another component's memory. WIT describes those interfaces, and language bindings turn them into callable APIs. A resource gives an interface a way to refer to an object whose implementation stays with its owner.

## Describing an interface

Suppose a shop needs to transfer currency through an economy component. The following illustrative WIT package describes that operation. It is an example contract, not a Pumpkin API:

```wit
package example:ledger@1.0.0;

interface accounts {
    enum transfer-error {
        unknown-account,
        insufficient-funds,
    }

    transfer: async func(
        source: string,
        destination: string,
        amount: u64,
    ) -> result<_, transfer-error>;
}

world shop {
    import accounts;
}

world ledger {
    export accounts;
}
```

The shop imports `accounts`; the ledger exports it. Both are compiled against the same operation and error types. Their source languages can differ because their bindings implement the component calling contract.

At activation, the host resolves the shop's import to a compatible provider. The proposed host bridge can do this without interpreting the meaning of a currency transfer. It still has to verify actual types and execution requirements; matching interface names alone is insufficient.

A generic bridge may represent arguments dynamically inside the host while the shop's generated interface stays typed. WIT remains the contract the two components see, not a generic `invoke(name, bytes)` call.

## Referring to stateful objects

A player, account, or pending decision has identity beyond a single function result. A resource handle lets the guest refer to that object while its implementation remains elsewhere.

For example, two plugins can receive handles referring to the same host-owned player:

```text
plugin A: local player handle ─┐
                              ├─ host object: the same player
plugin B: local player handle ─┘
```

The local handle values can differ. They are neither portable table indices nor pointers into the player's Rust allocation. The host resolves each handle, checks its type and lifetime, and applies the rights associated with it.

Owning a player handle also differs from owning the player's authoritative state. In the proposed domain model, mutations execute through the current gameplay owner even when the handle remains valid across region movement.

## Ownership and borrowing

WIT distinguishes an owned handle from a borrowed one. An owned handle transfers responsibility for its lifetime. A borrowed handle lends access for the call under the component model's borrowing rules.

This affects host cleanup. After transferring an owned handle to a guest, the host cannot later delete its saved resource-table index as if ownership had remained local. The guest may already have dropped the handle, and that slot may now represent another object. Cleanup must follow the actual ownership transfer.

A borrowed handle can participate in an async call while the runtime enforces its lifetime. This is not a Rust borrow of live world state. The host still releases world guards and mutable owner references before waiting.

## Forwarding resources between stores

Resources implemented by one component cannot simply be copied into another store. The proposed bridge gives the consumer a proxy that refers to the provider's resource.

For an extension-owned entry, that proxy needs to identify the provider instance and generation, its local entry identity, the consumer-visible resource type, and the ownership obligation. Calling a proxy method routes execution to that provider. The entry's private state remains there.

Aliases need consistent mapping, and destruction must release ownership exactly once. Several handles can refer to a shared backend, but forwarding an owned resource never duplicates its ownership. Resource types have identity, so two providers that export similarly named resources do not produce interchangeable handles.

A borrowed proxy expires with its call. An owned proxy creates a longer dependency on the provider. Whether the host keeps the provider resident or revokes the handle depends on the interface; see [retiring a provider](./lifecycle-and-linking#retiring-a-provider).

Streams and futures are not supported initially. They add transport state, backpressure, and cancellation that ordinary copied values do not have, and an interface that uses them fails resolution before activation.

## Capabilities and invocation scope

A handle can carry narrower authority than the underlying object supports. An event decision might allow inspection and cancellation while withholding unrelated world mutation.

Forwarding that handle to an extension preserves or reduces its authority. The host checks the decision's lifetime when an operation is attempted, even if a wrapper or shared Rust reference still exists.

Object lifetime and operation authority can end at different times. A retained player object may still exist after disconnection; a decision resource may still have wrappers after its commit window closes. Neither fact authorizes a late effect.

The [event chapter](./events) applies these rules to gameplay decisions. The [WIT reference](https://component-model.bytecodealliance.org/design/wit.html) and [Wasmtime component API](https://docs.rs/wasmtime/50.0.0/wasmtime/component/index.html) describe the underlying types and runtime operations.
