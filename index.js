import express from 'express'
import mongoose from 'mongoose'
import accountsRouter from './routes/accounts.js'
// Usado para encapsular variaveis 
require('dotenv').config()

// cria uma instancia do express
const app = express()
// usar formato json no express
app.use(express.json())
//Rota para os metodos HTTP
app.use("/accounts", accountsRouter)

app.listen(process.env.PORT, async () =>{
  try {
    await mongoose.connect('mongodb+srv://'+process.env.USERDB+':'+process.env.PWDB+'@trabalho-modulo-4.z8e52.mongodb.net/Accounts?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
    console.log('API Inicializada!!!')
  } catch (error) {
    console.log('Erro ao conectar no MongoDB' + error);
  }
})