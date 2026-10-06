import mongoose, { model, Schema, Types } from "mongoose";

interface INews {
    content: string;
    user_id: Types.ObjectId;
}

const NewsSchema = new Schema<INews>({
    user_id : {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
    }
},{timestamps: true})

const NewsSection = model<INews>('NewSection', NewsSchema);

export default NewsSection;