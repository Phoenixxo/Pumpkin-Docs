# Invocations and async execution

**Status:** Proposed. The store executor exists; independent v0.2 admission and the invocation-context contract do not. See [implementation status](./implementation-status).

An invocation is one operation admitted against a component instance. A command handler, an event callback, and a call to an extension can each create one. The runtime tracks each one through submission, execution, suspension, and completion.

## The life of an invocation

A player command that calls a remote service might follow this sequence:

```text
Submitted → admitted → running → waiting on I/O → ready → running → completed
```

Submission hands the work to the runtime. Admission accepts responsibility for it under the configured limits. A store driver then polls its guest task. When the guest awaits the service, the task stops executing until the result is available.

The waiting invocation remains accounted for. Its arguments, resources, completion state, and dependencies may all occupy memory. It releases active execution capacity, not its place in the outstanding-work budget.

Each invocation has an ID and caller identity. Nested invocations also carry a causal chain identifying their relationship to the original operation. Deadlines, cancellation, delegated authority, and gameplay revisions travel with the operation rather than being reconstructed from a worker thread.

## Store drivers

A store driver controls access to a Wasmtime store. The store contains the component's execution state and resource machinery; callers submit work through the driver instead of holding the store while doing unrelated I/O.

The v0.2 path uses Wasmtime's concurrent component APIs, including `Store::run_concurrent` and component calls through an `Accessor`. Tasks can overlap in lifetime and make progress when another task suspends. This is cooperative interleaving, not simultaneous execution of one instance's private state on several CPU cores.

Stackless guest bindings return to the component event loop while waiting. The event loop later resumes the appropriate task. What counts is the generated calling convention. An `async` WIT declaration permits suspension, but it does not prove that a guest uses this stackless path.

## Calls that return to an active component

Consider a parent calling an extension that needs a result from the parent:

```text
parent.run
  → extension.execute
    → parent.evaluate
```

The last call enters an instance with an earlier invocation still in progress. It can complete only if that instance permits the new task to start. A synchronous imported call or explicit component backpressure can prevent this even when the interface is declared async.

Consequently, callback support is part of the component's execution contract. It must be exercised with real guest bindings, not inferred from the export name or a host-only future. The [Component Model concurrency explainer](https://github.com/WebAssembly/component-model/blob/main/design/mvp/Concurrency.md#reentrance) describes this interaction.

The parent must also release application locks needed by the callback. No runtime can resolve a deadlock caused by a guest mutex held across the outbound call.

## Carrying context across the call

A nested invocation needs enough context to remain associated with its caller. That context has to cross host queues and task creation as well as component calls.

A Tokio task-local can carry information while execution stays in that task, but arbitrary spawned work does not inherit it automatically. A store-wide last-active invocation is also ambiguous once two independent calls overlap.

The API carries context through explicit scopes and invocation-bound resources ([ADR 0002](./decisions/0002-invocation-context)). A resource minted during an invocation, such as an event decision, identifies both the object and the invocation that authorizes its use. A long-lived handle, such as a player, identifies only the object, so operations on it take the caller's scope explicitly. Every export that can start host work receives its scope: commands, tasks, lifecycle callbacks, and resource methods as well as events.

## Admission under load

Limits count ready, running, and suspended work, together with retained bytes and resource costs. A rejected operation receives a defined admission failure before the runtime treats it as accepted.

Dependent work needs particular care. Imagine a store with four admitted invocations, all waiting for callbacks into that store. If callbacks share a four-slot cap and cannot enter until a parent finishes, all four parents remain stuck.

The runtime avoids this by giving dependency work its own budget, reserved by the root invocation and bounded in nesting depth and in the number of children ([ADR 0002](./decisions/0002-invocation-context)). When the budget runs out, the call is rejected immediately with an admission failure instead of waiting. A reserved budget covers only what its accounting counts, so the depth bound and immediate rejection are what stop arbitrary dependency cycles. The saturation tests in [validation](./validation) set the default limits.

Drivers also limit how much ready work they poll before yielding. Replies and shutdown control must still make progress during saturation, without an unbounded control queue and without reordering accepted work.

## Deadlines and cancellation

A caller can stop waiting before an invocation stops executing. The runtime tracks both events.

For a decision deadline, the host closes the decision's authority and applies the event's expiry policy. A late result cannot reopen the decision. If a host command already committed, its effect remains and must be accounted for separately.

Instruction limits and interruption handle CPU-bound guest code. Host I/O needs its own time and byte limits. Retiring a store can terminate more than one invocation, so a caller's timeout does not give isolated per-call termination.

The v0.1 callback pump stays confined to migration, and its shared root admission is absent from the final v0.2 path. See [migration](./migration) for removal conditions and [validation](./validation) for the required progress and failure tests.
