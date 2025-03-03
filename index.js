require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;



///middleware
const allowedOrigins =[
    'http://localhost:5000', //dev mode origin
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow access
        } else {
            callback(new Error("Not allowed by CORS")); // Deny access
        }
    },
    credentials: true
}));


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a75ke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection


     
        const database = client.db("eventDb");
        const usersCollection = database.collection("users"); 
        const eventsCollection = database.collection("events");

        // POST: Add new event
        app.post("/add-event", async (req, res) => {
            try {
                const { title, description, image, status, views } = req.body;
                if (!title || !description || !image) {
                    return res.status(400).send({ message: "Title, description, and image are required" });
                }

                const newEvent = {
                    title,
                    description,
                    image,
                    status: status || "pending", 
                    views: views || 0,
                };

                const result = await eventsCollection.insertOne(newEvent);
                res.status(201).json({ message: "Event added successfully", event: result });
            } catch (error) {
                console.error("Error adding event:", error);
                res.status(500).json({ message: "Server error", error });
            }
        });

        // GET: Fetch all approved events
        app.get("/all-events", async (req, res) => {
            try {
                const events = await eventsCollection.find({ status: "approved" }).sort({ views: -1 }).toArray();
                res.status(200).json(events);
            } catch (error) {
                console.error("Error fetching events:", error);
                res.status(500).json({ message: "Server error", error });
            }
        });


    
        app.post("/users", async (req, res) => {
            try {
                const { email, name, image } = req.body; // Get user data from request body

                if (!email) {
                    return res.status(400).send({ message: "Email is required" });
                }

                // Check if the user already exists by email
                const existingUser = await usersCollection.findOne({ email });
                if (existingUser) {
                    return res.status(400).send({ message: "User already exists" });
                }

                // Insert new user into the database
                const result = await usersCollection.insertOne({
                    email,
                    name,
                    image,
                    location: req.body.location || '',
                    description: req.body.description || ''
                });

                return res.status(201).send({ message: "User created successfully", user: result });
            } catch (error) {
                console.error("Error creating user:", error);
                return res.status(500).send({ message: "Server error" });
            }
        });

        app.get("/users", async (req, res) => {
            try {
                const users = await usersCollection.find().toArray(); // Fetch all users
                return res.status(200).json(users); // Send users as JSON response
            } catch (error) {
                console.error("Error fetching users:", error);
                return res.status(500).send({ message: "Server error" });
            }
        });



        // Update User - PUT /users
        app.put("/users", async (req, res) => {
            try {
                const { email, name, location, description, image } = req.body; // Get updated user data from request body

                if (!email) {
                    return res.status(400).send({ message: "Email is required" });
                }

                // Check if the user exists
                const existingUser = await usersCollection.findOne({ email });
                if (!existingUser) {
                    return res.status(404).send({ message: "User not found" });
                }

                // Update user data
                const updatedUser = await usersCollection.updateOne(
                    { email },
                    { $set: { name, location, description, image } }
                );

                return res.send({ message: "User updated successfully", updatedUser });
            } catch (error) {
                console.error("Error updating user:", error);
                return res.status(500).send({ message: "Server error" });
            }
        });
       
        // Get User Profile - GET /users/:email
        app.get("/users/:email", async (req, res) => {
            try {
                const email = req.params.email; // Get email from URL parameter

                // Find the user by email
                const user = await usersCollection.findOne({ email });

                if (!user) {
                    return res.status(404).send({ message: "User not found" });
                }

                // Return user data
                return res.send({ message: "User profile fetched successfully", user });
            } catch (error) {
                console.error("Error fetching user profile:", error);
                return res.status(500).send({ message: "Server error" });
            }
        });














     
     
        app.get('/',(req,res)=>{
            res.send('event db is arranging events');
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})
