import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'
import fs from 'fs'

interface DbSchema {
  users: User[] 
}

interface User  { 
      username: string,
      password: string,
      firstname: string,
      lastname: string,
      balance: Number
}

const readDbFile = (): DbSchema => {
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  return db
}

const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"

type JWTPayload = Pick<User, 'username' | 'password'>

app.post('/login',
  (req, res) => {

    const { username, password } = req.body
    // Use username and password to create token.
    const db = readDbFile()
    const user = db.users.find((data : any) => data.username === username)
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' })
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Invalid username or password' })
     
    }
    const token = jwt.sign({username : user.username,password : user.password } as JWTPayload , SECRET)
    return res.status(200).json({ message:"Login successfully", token})
  })

app.post('/register',
  (req, res) => {

    const { username, password, firstname, lastname, balance } = req.body
    const db = readDbFile()
    const hashPassword = bcrypt.hashSync(password, 10)
    const auser = db.users.find((item) => { 
     if(item.username === username ){
       return item;
     }else{
       return null;
     }
    })
    if(auser==null){
      db.users.push({
        username: username,
        password: hashPassword,
        firstname: firstname,
        lastname: lastname,
        balance: balance
      })
      fs.writeFileSync('db.json', JSON.stringify(db,null,2))
      res.status(200).json({
        message: 'Register succesfully',
      })
    }else{
      res.status(400).json({
        message: 'Username is already in used',
      })
    }
  })

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    const db = readDbFile()
    try {
      const { username,password} = jwt.verify(token, SECRET) as JWTPayload
      const auser = db.users.find((item) => { 
        if(item.username === username ){
          return item;
        }else{
          return null;
        }
       })
      res.status(200).json({
        name: auser?.firstname+' '+auser?.lastname,
        balance: auser?.balance
      })
    }
    catch (e) {
      //response in case of invalid token
      res.status(401).json({
        message: 'Invalid token',
      })
    }
  })

app.post<any,any,any>('/deposit',
  body('amount').isInt({ min: 1 }),
  (req, res) => {
    //Is amount <= 0 ?
    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })
      try{
        const db = readDbFile()
        const token = req.query.token as string
        const {amount} = req.body 
        const { username,password} = jwt.verify(token, SECRET) as JWTPayload
        const auser = db.users.find((item) => { 
          if(item.username === username ){
            return item;
          }else{
            return null;
          }
         })
         if(auser!==null){
          db.users.pop()          
          db.users.push({
            username: auser?.username as string,
            password: auser?.password as string,
            firstname: auser?.firstname as string,
            lastname: auser?.lastname as string,
            balance: auser?.balance+amount 
          })
          fs.writeFileSync('db.json', JSON.stringify(db,null,2))
          res.status(200).json({
            message: 'Deposit succesfully',
            balance: auser?.balance+amount
          })
         }
      }catch(e){
        res.status(401).json({
          message: 'Invalid token',
        })
      }
    
  })


app.post<any,any,any>('/withdraw',
  (req, res) => {
    try{
      const db = readDbFile()
      const token = req.query.token as string
      const {amount} = req.body 
      const { username,password} = jwt.verify(token, SECRET) as JWTPayload
      const auser = db.users.find((item) => { 
        if(item.username === username ){
          return item;
        }else{
          return null;
        }
       })
       const j = amount as Number
       const num =auser?.balance as Number
       if (!validationResult(req).isEmpty() || j > num)
        return res.status(400).json({ message: "Invalid data" })
       if(auser!==null && auser!==undefined){
        db.users.pop()
        db.users.push({
          username: auser?.username as string,
          password: auser?.password as string,
          firstname: auser?.firstname as string,
          lastname: auser?.lastname as string,
          balance: Number(auser?.balance )-amount
        })
        fs.writeFileSync('db.json', JSON.stringify(db,null,2))
        res.status(200).json({
          message: 'Withdraw succesfully',
         balance: Number(auser?.balance )-amount
        })
       }
    }catch(e){
      res.status(401).json({
        message: 'Invalid token',
      })
    }
  })

app.delete('/reset', (req, res) => {

  //code your database reset here
  const db = readDbFile()
  fs.writeFileSync('db.json', JSON.stringify({users:[]},null,2))
  return res.status(200).json({
    message: 'Reset database successfully'
  })
})

app.get('/me', (req, res) => {
  return res.status(200).json({
    firstname: "Thanachok",
    lastname : "Wirotsasithon",
    code : 620610791,
    gpa : 3.40

  })
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))
