import { model, Schema } from "mongoose";

interface IUser {
    display_name: string;
    email: string;
    googleId?: string;
    avatar_url?: string;
}

const userSchema = new Schema<IUser>({
    display_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    googleId : {
        type: String,
        required: false,
    },
    avatar_url: {
        type: String,
        required: false,
    },
} , {
    timestamps: true
})

const User = model<IUser>('User', userSchema);

export default User;