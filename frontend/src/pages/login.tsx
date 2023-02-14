import { gql, useMutation } from '@apollo/client';
import React from 'react';
import Helmet from 'react-helmet';
import { useForm } from 'react-hook-form';
import { FormError } from '../components/form-error';
import {
  LoginMutation,
  LoginMutationVariables
} from '../__generated__/graphql';
import uberLogo from '../images/logo.svg';
import { Button } from '../components/button';
import { Link } from 'react-router-dom';
import { isLoggedInVar } from '../apollo';

const LOGIN_MUTATION = gql`
  mutation login($loginInput: LoginInput!) {
    login(input: $loginInput) {
      ok
      error
      token
    }
  }
`;

interface ILoginForm {
  email: string;
  password: string;
}

export function Login() {
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ILoginForm>({
    mode: 'onChange'
  });
  const onCompleted = (data: LoginMutation) => {
    const {
      login: { ok, token }
    } = data;
    if (ok) {
      console.log(token);
      isLoggedInVar(true);
    }
  };
  const [loginMutation, { data: loginMutationResult, loading }] = useMutation<
    LoginMutation,
    LoginMutationVariables
  >(LOGIN_MUTATION, {
    onCompleted
  });
  const onSubmit = () => {
    if (!loading) {
      const { email, password } = getValues();
      loginMutation({
        variables: {
          loginInput: {
            email,
            password
          }
        }
      });
    }
  };
  return (
    <div className="h-screen flex items-center flex-col mt-10 lg:mt-28">
      <Helmet>
        <title> Login | Uber Eats </title>
      </Helmet>
      <div className="w-full max-w-screen-sm flex flex-col px-5 items-center">
        <img src={uberLogo} className="w-52 mb-10" />
        <h4 className="w-full font-medium text-left text-3xl mb-5">
          Welcome back
        </h4>
        <form
          className="grid gap-3 mt-5 mb-5 w-full"
          onSubmit={handleSubmit(onSubmit)}
        >
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            })}
            type="email"
            name="email"
            placeholder="Email"
            className="input"
          />
          {errors.email?.message && (
            <FormError errorMessage={errors.email?.message} />
          )}
          {errors.email?.type === 'pattern' && (
            <FormError errorMessage={'Please enter an valid email'} />
          )}
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: 10
            })}
            type="password"
            name="password"
            placeholder="Password"
            className="input"
          />
          {errors.password?.message && (
            <FormError errorMessage={errors.password?.message} />
          )}
          {errors.password?.type === 'minLength' && (
            <FormError errorMessage={'Password must be more than 10 chars.'} />
          )}
          <Button canClick={isValid} loading={loading} actionText={'Log In'} />
          {loginMutationResult?.login.error && (
            <FormError errorMessage={loginMutationResult.login.error} />
          )}
        </form>
        <div>
          New to Uber?{' '}
          <Link to="/create-account" className="text-lime-600 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
