export interface DatabaseConfig {
  DB: string;
  HOST: string;
  USER: string;
  PASSWORD: string;
  PORT: number;
  DIALECT: string;
}

export const databaseConfig: DatabaseConfig = {
  DB: "cra_database",
  HOST: "localhost",
  USER: "root",
  PASSWORD: "",
  PORT: 3002,
  DIALECT: "mysql"
}
