import mongoose, { Model, Schema } from "mongoose";

export interface IPurchase extends mongoose.Document {
  externalId: string;   // listing ID enviado como externalId a Niubiz
  orderId: string;      // ID de orden de Niubiz
  statusOrder: string;  // COMPLETED, CANCELLED, EXPIRED, etc.
  amount: string;
  currency: string;
  listingTitle: string;
  rawPayload: string;   // JSON completo recibido (para auditoría)
  createdAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    externalId:   { type: String, required: true },
    orderId:      { type: String, required: true, unique: true },
    statusOrder:  { type: String, required: true },
    amount:       { type: String, required: true },
    currency:     { type: String, default: "PEN" },
    listingTitle: { type: String, default: "" },
    rawPayload:   { type: String, required: true },
  },
  { timestamps: true }
);

const Purchase =
  (mongoose.models.Purchase as Model<IPurchase>) ||
  mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export default Purchase;
