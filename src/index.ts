import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import argon2 from "argon2";
import bodyParser from "body-parser";
import { Sequelize } from 'sequelize';
import {
  userDTO_db,
  craDTO_db,
} from '../DTO/SequelizeModels'

var cors = require('cors')
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB,
  process.env.USER,
  process.env.PASSWORD,
  {
    host: process.env.HOST,
    dialect: 'mysql'
  }
)

const app: Express = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors())


app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

const USER = sequelize.define('user', userDTO_db, {
  timestamps: false,
});

const CRA = sequelize.define('cra', craDTO_db, {
  timestamps: false,
});

app.use(express.json({
  type: "*/*"
}));

app.post("/signup", bodyParser.json(), async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, customer } = req.body;

  const user = await USER.findAll({
    where: {
      email: email
    }
  });

  if (user[0]) {
    console.log('already signed up');
    return res.json({ errorMsg: 'Already signed up', signedup: false })
  }



  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  // Minimum eight characters, at least one letter and one number
  if (PASSWORD_REGEX.test(password)) {

    const hashedPassword = await argon2.hash(password);

    USER.create({
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
      email: email,
      customer: customer,
      signatureURL: ''
    });

    return res.json({ email: email, password: hashedPassword, errorMsr: '', signedup: true })
  } else {
    console.log('invalid password');
    return res.json({ errorMsg: 'Password must contains at least eight characters, at least one letter and one number', signedup: false })
  }
});

app.post("/login", bodyParser.json(), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user: any = await USER.findAll({
    where: {
      email: email
    }
  });
  // SELECT * FROM `users` WHERE `email` = email;

  if (user[0]) {
    if (await argon2.verify(user[0].password, password)) {
      console.log('correct credentials');

    } else {
      return res.status(400).json({ logged: false, errorMsg: 'Incorrect password' });
    }
  } else {
    return res.status(400).json({ logged: false, errorMsg: 'Email not found' });
  }

  return res.json({
    email: email,
    firstName: user[0].firstName,
    lastName: user[0].lastName,
    customer: user[0].customer,
    id: user[0].id,
    logged: true,
    signatureURL:user[0].signatureURL,
    errorMsg: ''
  })
});

app.post("/updateprofile", bodyParser.json(), async (req: Request, res: Response) => {
  const { email, firstName, lastName, customer } = req.body;

  await USER.update(
    {
      lastName: lastName,
      firstName: firstName,
      customer: customer
    },
    {
      where: {
        email: email
      }
    });

  return res.json({ lastName: lastName, firstName: firstName, customer: customer, isupdated: true })
});

app.post("/uploadsignature", bodyParser.json(), async (req: Request, res: Response) => {
  const { signatureURL, email } = req.body;

  await USER.update(
    {
      signatureURL: signatureURL
    },
    { where: { email: email } }
  );

  return res.json({ signatureURL: signatureURL, isuploaded: true })
});

app.post("/createorupdatecra", bodyParser.json(), async (req: Request, res: Response) => {
  const { yearmonth, daysList, signatureDate, uid } = req.body;

  const thisCra = await CRA.findOne({
    where: {
      id_users: uid,
      yearmonth: yearmonth
    }
  })

  if (thisCra) {

    CRA.update({
      signed: false,
      daysList: daysList,
      signatureDate: signatureDate,
      id_users: uid
    },
      { where: { yearmonth: yearmonth } }
    )
    return res.json({ daysList: daysList })

  } else {

    CRA.create({
      signed: false,
      yearmonth: yearmonth,
      daysList: daysList,
      signatureDate: signatureDate,
      id_users: uid
    })
    return res.json({ daysList: daysList })

  }
});

app.post("/getcras", bodyParser.json(), async (req: Request, res: Response) => {
  const { uid } = req.body

  const cras = await CRA.findAll({
    where: {
      id_users: uid
    }
  });
  console.log(cras);

  return res.json({ craslist: cras })

})

app.post("/getsinglecra", bodyParser.json(), async (req: Request, res: Response) => {
  const { uid, yearmonth } = req.body

  const cra = await CRA.findOne({
    where: {
      id_users: uid,
      yearmonth: yearmonth
    }
  });
  if (cra) {
    console.log(cra);

    return res.json(cra)
  } else {
    return res.json({exist: false})
  }

})

app.post("/iscraexist", bodyParser.json(), async (req: Request, res: Response) => {
  const { yearmonth, uid } = req.body;

  const thisCra = await CRA.findOne({
    where: {
      id_users: uid,
      yearmonth: yearmonth
    }
  })

  if (thisCra) {
    return res.json({isExist: true})
  } else {
    return res.json({isExist: false})
  }
})

app.post("/signcra", bodyParser.json(), async (req: Request, res: Response) => {
  const { yearmonth, uid } = req.body;

  const today = new Date();
  const signatureDate = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`

  await CRA.update({
    signed: true,
    signatureDate: signatureDate
  },
    { where: { yearmonth: yearmonth, id_users: uid } }
  )

  const thisCra = await CRA.findOne({
    where: {
      id_users: uid,
      yearmonth: yearmonth
    }
  })
  console.log(thisCra);

  return res.json(thisCra)
})


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://${process.env.HOST}:${process.env.PORT}`);
});