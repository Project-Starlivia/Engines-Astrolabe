/** A single Strune node. Core fields are `id` and `references`; everything
 *  else is an extension (`additionalProperties: true` in strune.schema.json). */
export interface StruneNode {
  /** Unique identifier. Human-readable string recommended. */
  id: string;
  /** ids this node points at — each is a directed edge (self → target). */
  references: string[];
  /** Display name. Falls back to `id` when absent. */
  label?: string;
  /** Short description, shown in the center card and node tooltips. */
  description?: string;
  /** Renderer-defined extension fields are allowed. */
  [key: string]: unknown;
}
