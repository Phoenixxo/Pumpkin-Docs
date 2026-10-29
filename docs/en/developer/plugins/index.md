# Plugin subsystem

Pumpkin runs plugin code in response to events, commands, scheduled callbacks, and calls from other plugins. The plugin subsystem loads that code, connects it to the server, and controls its execution and lifetime.

These chapters are for contributors working on the host and runtime. If you are writing a plugin, start with the [plugin development guide](/plugin-dev/introduction).

::: info About this documentation
The architecture chapters describe the proposed v0.2 subsystem. Its store drivers and host bindings already have implementations, while domain ownership, event capabilities, and general component linking remain work in progress. The [implementation status](./implementation-status) lists what exists at a pinned source revision. Retiring v0.1 is a migration goal, and no removal release has been announced.
:::

## How a plugin runs

A Wasm plugin is distributed as a component. The component describes the functions it imports from its environment and exports to callers. Pumpkin supplies its host imports, creates an instance, and calls the instance's exports when work arrives.

For example, placing a block can trigger a plugin decision. The caller prepares the event, the plugin manager invokes registered handlers, and the host waits for the decision before committing placement. A handler can itself call a host function or another component. The runtime has to keep these calls moving without losing their relationship to the original placement.

The [architecture chapter](./design) follows this path through the subsystem. [Execution](./execution) explains what happens when a call suspends, and [events](./events) explains how its result affects gameplay.

## Components, instances, and stores

A component is executable code and its interface definitions. An instance is the live state created from that code. Instantiating the same component twice creates two independent sets of private state.

Wasmtime keeps execution state in a **store**. Pumpkin's store driver controls access to it and runs guest calls. A store is separate from an execution domain: the store contains plugin state, while a domain owns authoritative game state such as a region's blocks and entities.

The distinction matters for libraries. A library can have a private instance for each consumer, or it can provide one deliberately shared service instance. The package name does not say which. [Lifecycle and linking](./lifecycle-and-linking) describes these choices.

Native plugins take a different loading path and run directly in the server process. The same plugin manager can manage them, but they get none of Wasm's memory isolation or interruption guarantees.

## Reading by topic

For runtime work, read [execution](./execution), [interfaces and resources](./interfaces-and-resources), and [host integration](./host-integration). Together they explain invocation identity, resource lifetimes, and access to authoritative state.

For public API work, read [events](./events), [versioning](./versioning), and [migration](./migration). These chapters cover observable behavior as well as function signatures.

For implementation planning, use the [status inventory](./implementation-status), [validation guide](./validation), [roadmap](./roadmap), and [decision records](./decisions/). Those pages track evidence, rationale, and implementation order separately from the architectural explanation.

The [loader guide](./loaders) and [signing guide](./wasm-signing) cover existing adjacent mechanisms. Check them against the server revision you are changing.
