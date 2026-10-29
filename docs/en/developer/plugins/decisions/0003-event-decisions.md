# 0003: Separate event facts from decision changes

**Status:** Proposed. **Date:** 2026-10-28.

## Context

Returning an entire event value makes factual fields and permitted edits hard to distinguish. A resource wrapper establishes identity and lifetime, but whole-record getters and setters add boundary crossings without reducing copying.

## Decision

Model event facts, permitted decision changes, and invocation validity separately. The host owns staged decision state and the originating owner validates commit.

**Facts:** Everything that describes the operation as dispatched is a fact and is immutable inside the handler: the actor, world, target, original values, and source. A field is changeable only if the event's reference entry lists a method on the decision resource for it. Cancellation is such a method on every decision event.

**Representation:** Decision events use a hybrid: facts passed by value, and a decision resource with typed change methods. Whole-record getters and setters are not used. Notification events carry facts only. An event class departs from this only if a benchmark under [validation](../validation) shows a gain with identical semantics.

**Handler order:** Blocking handlers run one at a time in ascending priority, `lowest` first and `highest` last, so the highest priority has the final say. Handlers of equal priority run in plugin dependency order, then registration order. Each handler sees the permitted changes made by earlier ones. After a cancellation, later handlers still run, observe the cancelled state, and may reverse it. The last change in order wins. Nonblocking handlers cannot change the decision.

**Delivery:** Decision events are never detached, coalesced, or lost. Only notification events may be detached. A detached subscription has a bounded, lossless queue. When it overflows, the host rejects further deliveries to that subscription and records a diagnostic, and repeated overflow quarantines the plugin. Coalescing is a separate opt-in for state-sampling observations, such as the latest position, and never applies to a decision event.

**Expiry:** An expired decision rejects the governed action as if it were cancelled, and the host sends any client correction the action needs. An event's reference entry may declare a different outcome.

## Alternatives

Whole-event replacement keeps the existing shape but permits edits to fields that should be facts. Resource-only field access gives narrow operations but can multiply boundary calls. A hybrid can reduce returned data while keeping method costs. All three need correct lifetime rules, and the hybrid is chosen because it separates facts from changes without a call per fact.

## Consequences

Each decision event's reference entry lists its change methods and any non-default expiry outcome. Resource rights expire even if the guest retains a wrapper. Host commands that already committed remain effects; rejecting a late result does not undo them. Because expiry fails closed, a slow plugin makes the governed action fail, not proceed unchecked.

See [events](../events) and [validation](../validation).
