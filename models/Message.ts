import mongoose, { Model, Schema } from "mongoose";

export interface IMessage extends mongoose.Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

const Message =
  (mongoose.models.Message as Model<IMessage>) || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
