import mongoose, { Schema } from "mongoose";
import { encrypt, decrypt } from "../utils/encryption";

const doctorNoteSchema = new Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Encrypt note before saving
doctorNoteSchema.pre("save", function (next) {
  if (!this.isModified("note")) return next();
  if (!this.note.includes(":")) {
    this.note = encrypt(
      this.note,
      this.doctorId.toString(),
      this.patientId.toString()
    );
  }
  next();
});

// Method to get decrypted note
doctorNoteSchema.methods.getDecryptedNote = function () {
  return decrypt(
    this.note,
    this.doctorId.toString(),
    this.patientId.toString()
  );
};

const DoctorNote = mongoose.model("DoctorNote", doctorNoteSchema);
export default DoctorNote;
