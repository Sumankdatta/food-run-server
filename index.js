const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.f1hhq8d.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

function verifyJWt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {

    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        const serviceCollection = client.db('foodRun').collection('services')
        const reviewCollection = client.db('foodRun').collection('reviews')

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5' })
            res.send({ token })
        })

        app.get('/threeServices', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query).limit(3)
            const result = await cursor.toArray()

            res.send(result)
        })
        app.get('/Services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const result = await cursor.toArray()

            res.send(result)
        })
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const queryOfService = { _id: new ObjectId(id) }
            const queryOfReview = { serviceId: id }
            const service = await serviceCollection.findOne(queryOfService)
            const cursorOfReview = reviewCollection.find(queryOfReview)
            const review = await cursorOfReview.toArray()
            res.send({ service, review })
        })

        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { userId: id }
            const cursor = reviewCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)

        })

        app.get('/update/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) }
            const cursor = await reviewCollection.findOne(query)

            res.send(cursor)

        })

        app.put('/update/:id', verifyJWt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const review = req.body
            const updateDoc = {
                $set: {
                    message: review.message
                }
            }
            const result = await reviewCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        app.delete('/review/:id', verifyJWt, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await reviewCollection.deleteOne(query)
            res.send(result)
        })

        app.post('/addService', verifyJWt, async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service)
            res.send(result)
        })

        app.post('/review', verifyJWt, async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review)
            res.send(result)
        })

    } finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('RoodRun server is running')
})
app.listen(port, () => {
    console.log(`FoodRun server in running on ${port}`)
})