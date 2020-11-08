const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server');


const { validateRegisterInput, validateLoginInput } = require('../../utils/validators')
const { SECRET_KEY } = require('../../config.js')

const User = require('../../models/User');



module.exports = {
  Mutation: {
    async login(_, { username, password }){
        const {valid, errors } = validateLoginInput(username, password)
        const user = await User.findOne({ username });

        if(!user) {
          errors.general = 'User not found'
          throw new UserInputError('Wrong credenttials', { errors });
        }

        const match = await bcrypt.compare(password, user.password);
        if(!match){
          
        }
    },
    // register(parent, args, context, info) --> structure
    async register(_, {registerInput: { username, email, password, confirmPassword }}, context, info){
      // TODO: Validate user data
      const { valid, errors } = validateRegisterInput(username, email, password, confirmPassword)
      if (!valid) {
        throw new UserInputError('Errors', { errors });
      }
      // TODO: Make sure user doesn't already exist
      const user = await User.findOne({ username });

      if(user){
        throw new UserInputError("Username is taken",  {
          errors: {
            username: `This username is taken`
          }
        })
      }

      // hash password and create an auth token
      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        email, 
        username,
        password, 
        createdAt: new Date().toISOString()
      });

      const res = await newUser.save();

      const token = jwt.sign({
        id: res.id, 
        email: res.email, 
        username: res.username
      }, SECRET_KEY, {expiresIn: '1h'});

      return {
        ...res._doc, 
        id: res._id, 
        token
      }

    }
  
  }
}