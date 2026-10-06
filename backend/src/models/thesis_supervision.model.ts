import mongoose, { model, Types } from "mongoose";
import { Schema } from "mongoose";

interface IThesisSupervision {
    user_id: Types.ObjectId,
    student_name: string;
    degree_type: string;
    thesis_title: string;
    academic_year: string;
    status: string;
    co_supervisor: string;
    abstract: string;
    publication_url: string;
}

const ThesisSupervisionSchema = new Schema<IThesisSupervision>({
    user_id : {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }, 
    student_name : {
        type: String,
        required: true,
        trim: true,
    },
    degree_type : {
        type: String,
        required: true,
        trim: true,
    },
     thesis_title : {
        type: String,
        required: true,
        trim: true,
    },
     academic_year : {
        type: String,
        required: true,
        trim: true,
    },
     status : {
        type: String,
        required: true,
        trim: true,
    },
      co_supervisor : {
        type: String,
        required: true,
        trim: true,
    },
      abstract : {
        type: String,
        required: true,
        trim: true,
    },
      publication_url : {
        type: String,
        required: true,
        trim: true,
    },
}, {timestamps: true});

const ThesisSupervision = model<IThesisSupervision>('ThesisSupervision',ThesisSupervisionSchema);

export default ThesisSupervision;
