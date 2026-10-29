# 0002: Carry invocation context explicitly

**Status:** Proposed. **Date:** 2026-10-28.

## Context

Task-locals and a store-wide "last active" context cannot identify overlapping invocations across queues, component callbacks, and suspension points. [Execution](../execution#carrying-context-across-the-call) describes the failure cases.

## Decision

Assign explicit invocation identity, causal relationship, authority, deadline, and cancellation/completion state. Carry these across runtime boundaries.

Causal identity lets the runtime recognize related work. It grants no access to other domains, waives no resource validity checks, and provides no unlimited admission.

**Scope parameter or bound resource:**

- Resources minted during an invocation, such as an event decision, are bound to it. The host records the invocation when it creates the resource and checks it on every use.
- Operations on a long-lived handle (a player, world, or entity retained across calls) that can suspend or perform host work take the caller's scope explicitly, as a borrowed `scope` resource.
- Host functions that need no authority beyond the plugin's own, such as logging, take neither.

Every export that can start host work receives its invocation's scope. That covers events, commands, tasks, lifecycle callbacks, IPC, AI goals, and generation, so the rule is not specific to events.

**Long-lived resources:** A long-lived handle carries identity only. A new invocation uses it by passing that invocation's scope, and the handle never carries authority from the invocation that first produced it.

**Child budgets and rejection:** Work done on behalf of a root invocation (nested component calls and the host operations they trigger) draws on a dependency budget reserved by that root. The budget is bounded in nesting depth and in the number of child invocations. When it is exhausted, the call fails immediately with an admission failure that names the exhausted limit. It is never queued. The limits are server configuration, and the saturation tests in [validation](../validation) fix their default values before v0.2 is declared stable.

## Alternatives

Store-wide attribution stays unambiguous only if calls are serialized. Implicit task-local propagation needs special handling at every task hop and cannot identify arbitrary Wasmtime import futures. A universal guest-visible dynamic invocation protocol would duplicate WIT without solving authority.

## Consequences

The host API and SDKs change: exports gain a scope, and long-lived resource methods that can suspend take one. Events alone cannot carry context for all commands, tasks, lifecycle callbacks, and retained resource methods. The transport mechanism must be tested across every callback-capable operation before admission is relaxed.

See [execution](../execution) and [interfaces and resources](../interfaces-and-resources).
