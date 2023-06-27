import express from 'express'
import {MongoClient} from 'mongodb';
import { fileURLToPath } from 'url';
import path,{dirname} from 'path';
import { cartItems as cartItemsRaw,products as productsRaw } from './temp-data.js'

let cartItems=cartItemsRaw;
let products=productsRaw;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function start(){
   
    const url='mongodb+srv://adora:1234@getting-started.i2rya2y.mongodb.net'
    const client=new MongoClient(url);

    await client.connect();
    const db=client.db('full-stack');

    const app=express()
    app.use(express.json())

    app.use('/images',express.static(path.join(__dirname,'../assets')))

    app.get('/api/products',async (req,res)=>{
        
        const products=await db.collection('products').find({}).toArray();
        res.json(products)
    });
    
    async function populatedCartIds(ids){
        return Promise.all(ids.map(id=>db.collection('products').findOne({id})))
    }
    
    app.get('/api/users/:userId/cart',async (req,res)=>{
        const user= await db.collection('users').findOne({id:req.params.userId})
        const populatedCart= await populatedCartIds(user?.cartItems || [])
        res.json(populatedCart);
    });
    
    app.get('/api/products/:productId', async (req, res) => {
        try {
          const productId = req.params.productId;
          console.log(productId);
          const product = await db.collection('products').findOne({ id: productId });
          
          if (product) {
            res.json(product);
          } else {
            res.status(404).json({ error: 'Product not found' });
          }
        } catch (error) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });
    
    app.post('/api/users/:userId/cart',async(req,res)=>{
        const userId=req.params.userId;
        const productId=req.body.id;

        const existingUser=await db.collection('users').findOne({id:userId});
        if(!existingUser){
          await db.collection('users').insertOne({id:userId,cartItems:[]})
        }

        await db.collection('users').updateOne({id:userId},{
            $addToSet:{cartItems:productId}
        })
        
        const user= await db.collection('users').findOne({id:req.params.userId})
        const populatedCart= await populatedCartIds(user?.cartItems || [])
        res.json(populatedCart);
    
    })
    
    app.delete('/api/users/:userId/cart/:productId',async(req,res)=>{
        const userId=req.params.userId;
        const productId=req.params.productId;
        console.log(userId,productId);

        await db.collection('users').updateOne({id:userId},{
            $pull:{cartItems:productId}
        })
        const user= await db.collection('users').findOne({id:req.params.userId});
        console.log(user)
        const populatedCart= await populatedCartIds(user?.cartItems || [])
        res.json(populatedCart);
    })

    app.listen(8000,()=>{
        console.log('server is running');
    })

}






start();
