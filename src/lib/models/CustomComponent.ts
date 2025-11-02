import mongoose, { Schema, InferSchemaType } from "mongoose";

// A model for storing user‑generated custom components.  Each component
// includes a name, the prompt used to generate it, the generated
// code (stored as a string), an optional JSON config, and a flag
// indicating whether the component is publicly available to all users.
// Components can be scoped to a specific owner via `ownerEmail` or
// shared globally when `public` is true.  In combination with the
// unique index on `(ownerEmail, name)` this prevents duplicate names
// per user while allowing multiple users to define components with
// the same name.
const CustomComponentSchema = new Schema(
  {
    // Email of the component owner.  When null the component is
    // considered a public component available to all users.  For
    // private components this must match the authenticated user's
    // email address.
    ownerEmail: { type: String, index: true, default: null },
    // A human‑readable name for the component.  This name will be
    // used as the key within the Puck configuration as well as the
    // display label in the editor.  Names should be unique per
    // owner; a unique index on `(ownerEmail, name)` enforces this.
    name: { type: String, required: true },
    // The original prompt provided by the user when generating the
    // component.  Storing the prompt makes it possible to re‑create
    // components or audit how a component was generated.
    prompt: { type: String, default: "" },
    // The generated HTML/JSX code returned by the OpenAI API.  The
    // front‑end will render this code using `dangerouslySetInnerHTML`.
    code: { type: String, default: "" },
    // An optional Puck configuration fragment.  If present this
    // should contain a JSON object describing fields and other
    // options for the component.  For simple components this can
    // remain undefined.
    config: { type: Schema.Types.Mixed, default: null },
    // If true the component is publicly available to all users.  If
    // false the component is only visible to the owner.  When
    // `ownerEmail` is null this flag is implicitly true.
    public: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure each user cannot create two components with the same name.
// For public components we use a null ownerEmail so this index
// still treats name as unique globally.
CustomComponentSchema.index({ ownerEmail: 1, name: 1 }, { unique: true });

export type CustomComponent = InferSchemaType<typeof CustomComponentSchema> & { _id: mongoose.Types.ObjectId };
export const CustomComponentModel = mongoose.models.CustomComponent || mongoose.model("CustomComponent", CustomComponentSchema);