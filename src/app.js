import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from 'joi'
import dayjs from 'dayjs'

// Criação do servidor
const app = express()

// Configurações
app.use(express.json())
app.use(cors())
dotenv.config()
// Conexão com o Banco de Dados
let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


// Endpoints
app.post("/participants",async (req, res) => {
    const {name} = req.body
    const nomeParticipante = joi.object({
        name: joi.string().required()
      })
    const validate = nomeParticipante.validate(req.body)
    if (validate.error) return res.sendStatus(422)
    // const verificaNome = db.collection("participants").find().toArray()
    // const pessoa = verificaNome.find((verificaNome)=> verificaNome.name === name)
    // res.send(name)
    const verificaNome= await db.collection("participants").findOne({ name: name })
    if(!verificaNome){
        try{
            const novoArrayParticipante = {
                name,
                lastStatus: Date.now()
            }
    
            const hora = dayjs().format('HH:mm:ss')
            const mensagem = {
                from: name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: hora
            }
    
            await db.collection("participants").insertOne(novoArrayParticipante);
            await db.collection("messages").insertOne(mensagem);
            return res.sendStatus(201)
        }catch (err){
            console.log(err);
            res.sendStatus(500);
          }
    }else{
        res.sendStatus(409);
    }
    
})

app.get("/participants", async(req, res) => {
    const participantes = await db.collection("participants").find().toArray()
        .then((participantes) => res.status(200).send(participantes))
        .catch((err) => res.status(500).send(err.message))
})

app.get("/messages",async (req, res) => {
    const {user} = req.headers
    const {limit} = req.query

    if(!limit){
        try{
            const pegaMensagemToda = await db.collection("messages").find({$or: [{ to: 'Todos' }, 
            { to: user }, { from: user }]}).toArray()
            res.status(200).send(pegaMensagemToda)
        }catch(err){
            console.log(err);
            res.sendStatus(500);
        }
    }else if(limit <=0 || isNaN(limit)){
        res.sendStatus(422);
    }else{
        try{
            const pegaMensagemLimite = await db.collection("messages").find({$or: [{ to: 'Todos' }, 
            { to: user }, { from: user }]}).toArray()

            const novaLista = []
            if(pegaMensagemLimite.length<=limit){
                res.status(200).send(pegaMensagemLimite)
            }
            else{
                for(let i=pegaMensagemLimite.length-limit; i<pegaMensagemLimite.length;i++){
                    novaLista.push(pegaMensagemLimite[i])
                }
                res.status(200).send(novaLista)
            }
        }catch(err){
            console.log(err);
            res.sendStatus(500);
        }
    }

   




})




// Deixa o app escutando, à espera de requisições
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na portaa ${PORT}`))