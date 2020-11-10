import express from 'express'
import {userModel} from '../models/user.js'

const router = express.Router()

//Endpoint para lista todos usuario.
router.get("/list", async (req, res) => { 
  try {
   
    const user = await userModel.find({});

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send('erro' + error)
  }
});

// Endpoint para consultar saldo
router.get("/:agencia/:conta", async (req, res) =>{
  try {
    const agencia = req.params.agencia;
    const conta = req.params.conta;

    // Pesquisando pelo usuario.
    const user = await userModel.find({$and: [{agencia: {$eq: agencia}} , {conta: {$eq: conta}}]},
       {_id: 0, balance: 1});

    // Validação
    if (user.length === 0) {
      res.status(404).send('Conta não encontrada, verifique se os dados estão corretos');
    }
    
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send('erro' + error)
  }
})

//Endpoint para cadastro de usuario
router.post("/user", async (req, res) => {
  try {
    const user = new userModel(req.body);
    await user.save();

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send('erro' + error)
  }
});

// Endpoint para deposito
router.patch("/deposito/:agencia/:conta/:value", async (req, res) =>{
  try {
    const agencia = req.params.agencia
    const conta = req.params.conta;
    const newBalance = parseInt(req.params.value);

    //Pesquisando e atualizando valores.
    let user = await userModel.findOneAndUpdate(
     {conta: {$eq: conta}}, 
     {$inc: {balance: newBalance}},
     {new: true});

    if (!user || newBalance <= 0) {
      throw new Error(`Agencia ou conta não encontrados, para efetuar 
      depositos o valor deve ser maior que zero!!`);
    }

    // consultando somente o balance.
    user = await userModel.find({$and: [{agencia: {$eq: agencia}} , {conta: {$eq: conta}}]}, 
          {_id: 0, balance: 1});

    res.status(200).send(user)
  } catch (error) {
    res.status(500).send('erro' + error)
  }
})

// Endpoint para saque.
router.put("/saque/:agencia/:conta/:value", async (req, res) =>{
  try {
    const agencia = req.params.agencia
    const conta = req.params.conta;
    const newBalance = parseInt(req.params.value) + 1;
    
    //Pesquisando e atualizando valores.
    let user = await userModel.findOneAndUpdate(
      {$and: [{agencia: {$eq: agencia}} , {conta: {$eq: conta}}, {balance:{$gt: newBalance}}]}, 
      {$inc: {balance: -newBalance}},
      {new: true});

    // Validações.
    if (!user || newBalance <= 0) {
      throw new Error(`Agencia ou conta não encontrados, para efetuar 
      saques o valor deve ser maior que zero!!`)
    }

    user = await userModel.find({$and: [{agencia: {$eq: agencia}} , {conta: {$eq: conta}},]}, 
            {_id: 0, balance: 1});

    res.status(200).send(user)
  } catch (error) {
    res.status(500).send("Saldo insuficiente para saque!!!")
  }
})

//Endpoint para excluir conta.
router.delete("/:agencia/:conta", async (req,res) =>{
  try {
    const agencia = req.params.agencia;
    const conta = req.params.conta;

    const user = await userModel.deleteOne({$and: [{agencia: {$eq: agencia}} , {conta: {$eq: conta}}]})

    res.status(200).send(user)
  } catch (error) {
    res.status(500).send("Não foi possível deletar um usuario!!!")
  }
})

//Endpoint para transferencia.
router.put("/transferencia/:contaOrigem/:contaDestino/:value", async (req,res) =>{
  try {
    const contaOrigem = req.params.contaOrigem;
    const contaDestino = req.params.contaDestino;
    const value = parseInt(req.params.value);
    const valuecomTaxa = parseInt(req.params.value) + 8;

    let userDebito = await userModel.findOne({conta: {$eq: contaOrigem}})
    let userCredito = await userModel.findOne({conta: {$eq: contaDestino}})

    if(parseInt(userDebito.agencia) === parseInt(userCredito.agencia)){
      userDebito = await userModel.findOneAndUpdate({conta: {$eq: contaOrigem}},
        {$inc: {balance: -value}},
        {new: true});

        userCredito = await userModel.findOneAndUpdate({conta: {$eq: contaDestino}},
          {$inc: {balance: value}},
          {new: true});
    }else{
        userDebito = await userModel.findOneAndUpdate({conta: {$eq: contaOrigem}},
          {$inc: {balance: -valuecomTaxa}},
          {new: true});

        userCredito = await userModel.findOneAndUpdate({conta: {$eq: contaDestino}},
          {$inc: {balance: value}},
          {new: true});
    }

    res.send({userDebito, userCredito})
  }catch (error) {
    res.status(500).send("Não foi possível realizar a transferencia!!!")
  }
})

// Endpoint Media. 
router.get("/:agencia", async (req, res) => {
  try {
    const agencia = parseInt(req.params.agencia);

    const user = await userModel.aggregate([{$match: {agencia: agencia}},
      {$group: {_id: "$agencia", media:{$avg:"$balance"}}}])
  
    res.status(200).send(user)
  } catch (error) {
    res.status(500).send("Não foi possível consultar a média!!!")
  }
})

//Endpoint lista maiores salarios
router.get("/list/user/saldoMaior/:limite", async (req, res) => { 
  try {
    const lim = parseInt(req.params.limite)
    const user = await userModel.find({},{_id: 0, balance: 1, name: 1, agencia: 1, conta: 1})
    .sort({balance: -1}).limit(lim);

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send('erro' + error)
  }
});

//Endpoint lista menores salarios
router.get("/list/user/saldoMenor/:limite", async (req, res) => { 
  try {
    const lim = parseInt(req.params.limite)
    const user = await userModel.find({},{_id: 0, balance: 1, name: 1, agencia: 1, conta: 1})
    .sort({balance: 1}).limit(lim);

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send('erro' + error)
  }
});

//Endpoint para transferir clientes para agencia 99. 
router.patch("/transferir/clientes", async (req, res)=>{
  try {
    //Pegar o cliente com maior saldo da agencia 10
    let agencia = 10
    let userAgencia10 = await userModel.find({agencia: {$eq: agencia}}).sort({balance: -1}).limit(1);

    //Pegar o cliente com maior saldo da agencia 25
    agencia = 25
    let userAgencia25 = await userModel.find({agencia: {$eq: agencia}}).sort({balance: -1}).limit(1);

    //Pegar o cliente com maior saldo da agencia 47
    agencia = 47
    let userAgencia47 = await userModel.find({agencia: {$eq: agencia}}).sort({balance: -1}).limit(1);

    //Pegar o cliente com maior saldo da agencia 33
    agencia = 33
    let userAgencia33 = await userModel.find({agencia: {$eq: agencia}}).sort({balance: -1}).limit(1);

    //Atulizando a agencia dos clientes para agencia 99.
    userAgencia10 = await userModel.updateOne({$and: [{agencia: {$eq: 10}} , {conta: {$eq: 1027}}]},
     {$set: {agencia: "99"}});
    
    userAgencia25 = await userModel.updateOne({$and: [{agencia: {$eq: 25}} , {conta: {$eq: 3003}}]},
      {$set: {agencia: "99"}});

    userAgencia47 = await userModel.updateOne({$and: [{agencia: {$eq: 47}} , {conta: {$eq: 2221}}]},
      {$set: {agencia: "99"}});

    userAgencia33 = await userModel.updateOne({$and: [{agencia: {$eq: 33}} , {conta: {$eq: 9123}}]},
      {$set: {agencia: "99"}});

    res.send({userAgencia10,userAgencia25,userAgencia47,userAgencia33})
  } catch (error) {
    res.status(500).send('erro' + error)
  }
})

export default router;