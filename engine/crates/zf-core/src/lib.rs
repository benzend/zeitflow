//! Pure Zeitflow engine core.
//!
//! Types, graph validation, entry selection, and the one variable-substitution
//! implementation. There is no database, network, or filesystem access here.
//! Behavior matches `lib/workflow-engine.ts`, which is what
//! `pages/api/workflow/[id]/execute.ts` runs. Where that file and
//! `lib/integrations/executor.ts` disagree, this crate follows the execute.ts
//! function and the difference is recorded in `engine/README.md`.

#![forbid(unsafe_code)]

mod error;
mod graph;
mod jsonutil;
mod label;
mod replay;
mod substitute;
mod types;
mod variables;

pub use error::EngineError;
pub use label::label_to_variable_name;
pub use replay::replay;
pub use substitute::substitute_variables;
pub use types::{ReplayInput, ReplayResult, WorkflowConnection, WorkflowNode};
