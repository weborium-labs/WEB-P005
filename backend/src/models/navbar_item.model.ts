import mongoose, { model, Schema, Types } from "mongoose";

interface INavItems {
    item_name: string;
    sub_section: Types.ObjectId;
    user_id: Types.ObjectId;
}

const NavItemSchema = new Schema<INavItems>({
    item_name: {
        type: String,
        required: true,
        trim: true,
    },
    user_id:{
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    sub_section: {
        type: mongoose.Types.ObjectId,
        ref: '',
        required: true,
    }
})

const NavbarItem = model<INavItems>('NavbarItem',NavItemSchema)

export default NavbarItem;