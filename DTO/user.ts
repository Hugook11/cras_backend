export class User {
  email: string;
  password: string;
  firstName: string;
  lastName:string;


  constructor (email: string, password: string, firstName:string, lastName:string) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.email = email;
  }

  setInfos (firstName:string, lastName:string, password: string, email:string): void {
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.email = email;
  }

  setFirstName(username:string): void {
    this.firstName = username;
  }

  setpassword(password:string): void {
    this.password = password;
  }

}