import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sets: { type: Number, min: 1, default: 1 },
    repetitions: { type: String, default: "" },
    restSeconds: { type: Number, min: 0, default: 0 }
}, { _id: false });

const workoutPlanSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", default: null },
    planName: { type: String, required: true },
    goal: { type: String, default: "" },
    weeklySchedule: { type: String, default: "" },
    exercises: { type: [exerciseSchema], default: [] },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model("WorkoutPlan", workoutPlanSchema);
