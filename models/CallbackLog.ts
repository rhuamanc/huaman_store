import mongoose, { Model, Schema } from "mongoose";

export interface ICallbackLog extends mongoose.Document {
  receivedAt: Date;
  method: string;
  headers: Record<string, string>;
  rawBody: string;
  parsedBody: Record<string, unknown> | null;
  signature: string;
  signatureValid: boolean;
  outcome: "processed" | "invalid_signature" | "missing_signature" | "parse_error" | "listing_not_found" | "ignored";
  notes: string;
}

const CallbackLogSchema = new Schema<ICallbackLog>(
  {
    receivedAt:     { type: Date, default: Date.now, index: true },
    method:         { type: String, default: "POST" },
    headers:        { type: Schema.Types.Mixed, default: {} },
    rawBody:        { type: String, required: true },
    parsedBody:     { type: Schema.Types.Mixed, default: null },
    signature:      { type: String, default: "" },
    signatureValid: { type: Boolean, default: false },
    outcome:        {
      type: String,
      enum: ["processed", "invalid_signature", "missing_signature", "parse_error", "listing_not_found", "ignored"],
      required: true,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: false }
);

const CallbackLog =
  (mongoose.models.CallbackLog as Model<ICallbackLog>) ||
  mongoose.model<ICallbackLog>("CallbackLog", CallbackLogSchema);

export default CallbackLog;
