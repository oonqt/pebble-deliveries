import mongoose, { Schema, Document } from 'mongoose';

export interface Package {

}

export interface User extends Document {
    timelineToken: string;
    packages: Package[];
    pinsEnabled: boolean;
}

const UserSchema: Schema<User> = new Schema({
    pinsEnabled: {
        type: Boolean,
        required: true
    },
    timelineToken: {
        type: String,
        required: true,
        unique: true
    },
    packages: {
        type: [
            {
                name: String,
                trackingId: Number
            }
        ],
        default: []
    }
});

export default mongoose.model<User>('users', UserSchema);