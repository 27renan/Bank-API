import express from 'express'
import mongoose from 'mongoose'
import accountsRouter from './routes/accounts.js'

// cria uma instancia do express
const app = express()
// usar formato json no express
app.use(express.json())
//Rota para os metodos HTTP
app.use("/accounts", accountsRouter)

app.listen(3000, async () =>{
  try {
    await mongoose.connect('mongodb+srv://renan:27101991@trabalho-modulo-4.z8e52.mongodb.net/Accounts?retryWrites=true&w=majority',
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