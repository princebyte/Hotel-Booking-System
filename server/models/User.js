import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  _id : {type : String},
  username : {type : String, default: "User"},
  email : {type : String, default: ""},
  image : {type : String, default: ""},
  role : {type : String, enum: ["user", "hotelOwner"], default: "user"},
  recentSearchedCities : [{type : String}],
},{timestamps: true}
);

const User = mongoose.model("User", userSchema);

export default User;