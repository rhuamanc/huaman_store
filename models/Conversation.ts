import mongoose, { Model, Schema } from "mongoose";

export interface IConversation extends mongoose.Document {
  listing: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ listing: 1, buyer: 1, seller: 1 }, { unique: true });

const Conversation =
  (mongoose.models.Conversation as Model<IConversation>) ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
