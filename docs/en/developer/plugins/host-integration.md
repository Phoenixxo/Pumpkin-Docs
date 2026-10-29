# Host functions and game-state ownership

**Status:** Proposed. The current host exposes server objects through host state and existing synchronization instead of routing operations to owners. See [implementation status](./implementation-status).

A host function is a component's route to services outside its private memory. It can log a message, request I/O, invoke another component, or ask Pumpkin to perform a game operation. Each host function's implementation decides what authority the guest actually receives. Under the ownership model, authoritative game operations are routed to the owner of the state they touch.

## A store is not a gameplay owner

The store driver controls access to Wasmtime execution state. A gameplay owner controls authoritative state such as a region's blocks and entities. Calling a host function crosses the first boundary, but does not automatically grant the second.

For example, an extension handling an event in Region A might request an operation on an entity now owned by Region B. The host resolves the entity's current owner and submits the request there. The extension does not need a public Region B identifier or a pointer into its state.

Owners come in Global, World, Region, and movable Entity forms where appropriate. How they map to threads or tasks is a host decision, and an owner can be a logical execution boundary rather than a dedicated operating-system thread.

## Requesting an authoritative operation

An owner-directed request needs the target identity, owned arguments, invocation authority, relevant generation or revision, and a way to report completion.

The host resolves the target, submits the command, and awaits its outcome without retaining a store borrow or gameplay guard. The owner validates and executes the operation against state it controls.

A request can fail because the target disappeared, moved, changed revision, lost authority, expired, or could not be admitted. Callers need to distinguish outcomes that justify a retry from outcomes where an effect may already have happened. Repeating an uncertain command without an idempotency contract can duplicate its effects.

An owner directory and generation checks make stale requests detectable during entity movement. The transfer protocol belongs to the world architecture. The plugin subsystem consumes it rather than maintaining a second ownership system.

Operations that span two owners are not atomic. Each owner command completes or fails on its own and the caller receives each outcome, so sending commands to A and then B can leave A applied and B rejected.

## Returning to the same owner

A placement operation in Region A can await a plugin that requests information from Region A. If the placement holds an exclusive world guard while waiting, the host request cannot complete.

The managed gameplay task instead parks without that guard. The owner admits eligible work, completes the host request, and later resumes placement to revalidate and commit its decision. This requires both an enforceable state boundary and a progress policy.

## Scheduled callbacks

Tick scheduling determines when work becomes due. Invocation scheduling determines how admitted work executes and waits. They are different services.

A callback due after twenty ticks enters the same managed invocation path as a command or event handler, so its identity, cancellation, authority, and completion behave the same way. The contract adds no implicit tick-aligned delay.

A repeating task never overlaps itself. If one run is still executing or waiting when the next becomes due, the host skips the next run and counts it in the task's diagnostics, so no backlog builds up.

Task IDs are associated with their owner, and cancelling a task checks that authority. Waiting for admission still counts as outstanding work.

## External I/O and CPU work

Filesystem, socket, HTTP, and database operations can complete while guest execution is suspended. They have their own time, concurrency, byte, and permission limits because guest instruction accounting does not meter arbitrary host work.

An external operation may commit after its caller stops waiting. The runtime still accounts for its completion and releases its resources; it cannot promise rollback simply by dropping a future.

Finite CPU jobs can run on a compute executor with immutable inputs. Their results return to an authoritative owner for validation. A job treated as a leaf must not call into plugins or wait for ownership while it occupies a simulation worker.

## Native plugins and observability

Native plugins are trusted in-process code ([ADR 0001](./decisions/0001-async-execution)). They can retain unrestricted server references and so bypass the host-operation path, which means the subsystem gives them no ownership, isolation, or interruption guarantee. A plugin that needs those guarantees ships as Wasm.

Metrics should separate admission delay, owner queue age, execution time, I/O wait, and commit rejection. That distinction makes a slow provider distinguishable from a congested world owner.
