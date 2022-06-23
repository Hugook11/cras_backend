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
);

const app: Express = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());


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

  const user = await USER.findOne({
    where: {
      email: email
    }
  });

  if (user) {
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

  const user: any = await USER.findOne({
    where: {
      email: email
    }
  });

  if (user) {
    if (await argon2.verify(user.password, password)) {
      console.log('correct credentials');

    } else {
      return res.status(400).json({ logged: false, errorMsg: 'Incorrect password' });
    }
  } else {
    return res.status(400).json({ logged: false, errorMsg: 'Email not found' });
  }

  return res.json({
    email: email,
    firstName: user.firstName,
    lastName: user.lastName,
    customer: user.customer,
    id: user.id,
    logged: true,
    signatureURL: user.signatureURL,
    errorMsg: ''
  })
});

app.put("/user/:userid", bodyParser.json(), async (req: Request, res: Response) => {
  const userid = req.params.userid;
  const { firstName, lastName, customer } = req.body;

  await USER.update(
    {
      lastName: lastName,
      firstName: firstName,
      customer: customer
    },
    {
      where: {
        id: userid
      }
    });

  return res.json({ lastName: lastName, firstName: firstName, customer: customer, isupdated: true })
});

app.put("/user/:userid/signature", bodyParser.json(), async (req: Request, res: Response) => {
  const { signatureURL } = req.body;
  const userid = req.params.userid;

  await USER.update(
    {
      signatureURL: signatureURL
    },
    { where: { id: userid } }
  );

  return res.json({ signatureURL: signatureURL, isuploaded: true });
});

app.post("/user/:userid/cra/:yearmonth", bodyParser.json(), async (req: Request, res: Response) => {
  const { daysList, signatureDate } = req.body;
  const userid = req.params.userid;
  const yearmonth = req.params.yearmonth;

  const thisCra = await CRA.findOne({
    where: {
      id_users: userid,
      yearmonth: yearmonth
    }
  })

  if (thisCra) {
    CRA.update({
      signed: false,
      daysList: daysList,
      signatureDate: signatureDate,
      id_users: userid
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
      id_users: userid
    })
    return res.json({ daysList: daysList })
  }
});

app.get("/user/:userid/cras", async (req: Request, res: Response) => {
  const userid = req.params.userid

  const cras = await CRA.findAll({
    order: [
      ['yearmonth', 'DESC']
    ],
    where: { id_users: userid }
  });
  return res.json({ craslist: cras })
});

app.get("/user/:userid/cra/:yearmonth", async (req: Request, res: Response) => {
  const userid = req.params.userid
  const yearmonth = req.params.yearmonth
  const cra = await CRA.findOne({
    where: {
      id_users : userid,
      yearmonth: yearmonth
    }
  });

  if (cra) {
    return res.json(cra);
  } else {
    return res.status(404).send('no cra');
  }
});

app.put("/user/:userid/cra/:yearmonth/sign", bodyParser.json(), async (req: Request, res: Response) => {
  const yearmonth = req.params.yearmonth;
  const userid = req.params.userid;

  const today = new Date();
  const signatureDate = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`

  await CRA.update({
    signed: true,
    signatureDate: signatureDate
  },
    { where: { yearmonth: yearmonth, id_users: userid } }
  )

  const thisCra = await CRA.findOne({
    where: {
      id_users: userid,
      yearmonth: yearmonth
    }
  })
  return res.json(thisCra)
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://${process.env.HOST}:${process.env.PORT}`);
});
