# ExecPlan policy

Use an ExecPlan for work that changes multiple packages, public interfaces, rendering boundaries,
storage, privacy, or build tooling.

An ExecPlan must be self-contained and updated while implementation proceeds. It records:

- the user-visible goal and non-goals;
- architectural and compatibility constraints;
- ordered milestones with acceptance checks;
- progress, decisions, discoveries, and remaining risks;
- exact validation commands and their outcomes.

Keep implementation changes separate from architectural documentation changes inside the plan, even
when both are delivered in the same task. Do not mark a milestone complete until its acceptance
checks have actually run.
