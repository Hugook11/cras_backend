import { DataTypes } from 'sequelize';

export const userDTO_db = {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  customer: DataTypes.STRING,
  signatureURL: DataTypes.STRING
};

export const craDTO_db = {
  signed: DataTypes.BOOLEAN,
  yearmonth: DataTypes.STRING,
  daysList: DataTypes.STRING,
  signatureDate: DataTypes.STRING,
  id_users: DataTypes.INTEGER
}
