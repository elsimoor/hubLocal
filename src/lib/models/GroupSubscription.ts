import mongoose, { Schema, InferSchemaType } from "mongoose";

const GroupSubscriptionSchema = new Schema(
  {
    userEmail: { type: String, index: true, required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    clonedGroupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
  },
  { timestamps: true }
);

GroupSubscriptionSchema.index({ userEmail: 1, groupId: 1 }, { unique: true });

export type GroupSubscription = InferSchemaType<typeof GroupSubscriptionSchema> & { _id: mongoose.Types.ObjectId };
export const GroupSubscriptionModel =
  mongoose.models.GroupSubscription || mongoose.model("GroupSubscription", GroupSubscriptionSchema);
