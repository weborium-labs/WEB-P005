import mongoose, { model, Schema, Types } from "mongoose";

interface ISubNavItems {
    parent_item: Types.ObjectId;
    item_name: string;
    page_content: string;
    item_type: string;
}

const SubNavItemSchema = new Schema<ISubNavItems>({
    parent_item : {
        type: mongoose.Types.ObjectId,
        ref:'NavbarItems',
        required: true,
    },
    item_name : {
        type: String,
        required: true,
        trim: true,
    },
    page_content: {
        type: String,
        required: true,
        trim: true
    },
    item_type : {
        type: String,
        required: true,
        trim: true,
        enum : ['navItem', 'gallery']
    }
}, {timestamps: true});

const SubNavItem = model<ISubNavItems>('SubNavItem',SubNavItemSchema);

export default SubNavItem;