import mongoose, { Schema } from "mongoose";
import mongoooseAggrigate from "mongoose-aggregate-paginate-v2";

const videoSchema = Schema({
  videoFile: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
});

videoSchema.plugin(mongoooseAggrigate);
export const Video = mongoose.model("Video", videoSchema);
