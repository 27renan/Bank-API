import mongoose from 'mongoose'

// Schema utilizado no mongoDB
const userShema = mongoose.Schema({
  agencia:{
    type: Number,
    required: true,
  },
  conta:{
    type: Number,
    required: true,
  },
  name:{
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    //Função para verificar se o balance inserido é menor que zero.
    validate(balance) {
      if ( balance < 0) throw new Error('Valor negativo para nota');
    },
  },
});

const userModel = mongoose.model('users',userShema,'users' )

export { userModel };
