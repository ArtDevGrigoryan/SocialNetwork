export interface ILoginDto {
  username: string;
  email: string;
  password: string;
}

export interface SignupDto {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface IForgotPasswordStep1Dto {
  email: string;
}

export interface IForgotPasswordStep2Dto {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}
