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

//consts Joy
const nomeParticipante = joi.object({
    name: joi.string().required()
  })


// Endpoints
app.post("/participants",async (req, res) => {
    const {name} = req.body
    const validate = nomeParticipante.validate(req.body)
    if (validate.error) return res.sendStatus(422)

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

        await db.collection("participants").insertOne({novoArrayParticipante});
        await db.collection("messages").insertOne({mensagem});
        return res.sendStatus(201)
    }catch (err){
        console.log(err);
        res.sendStatus(500);
      }
})

app.get("/participants",(req, res) => {
    const participantes = db.collection("participants").find().toArray()
        .then((participantes) => res.status(200).send(participantes))
        .catch((err) => res.status(500).send(err.message))
})




// Deixa o app escutando, à espera de requisições
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na portaa ${PORT}`))