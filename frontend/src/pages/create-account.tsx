import { gql, useMutation } from '@apollo/client';
import React from 'react';
import Helmet from 'react-helmet';
import { useForm } from 'react-hook-form';
import { FormError } from '../components/form-error';
import {
  CreateAccountMutation,
  CreateAccountMutationVariables,
  UserRole
} from '../__generated__/graphql';
import uberLogo from '../images/logo.svg';
import { Button } from '../components/button';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router';

const CREATE_ACCOUNT_MUTATION = gql`
  mutation createAccount($createAccountInput: CreateAccountInput!) {
    createAccount(input: $createAccountInput) {
      ok
      error
    }
  }
`;

interface ICreateAccountForm {
  email: string;
  password: string;
  role: UserRole;
}

export function CreateAccount() {
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ICreateAccountForm>({
    mode: 'onChange',
    defaultValues: {
      role: UserRole.Client
    }
  });
  const history = useHistory();
  const onCompleted = (data: CreateAccountMutation) => {
    const {
      createAccount: { ok }
    } = data;
    if (ok) {
      history.push('/login');
    }
  };
  const [
    createAccountMutation,
    { data: createAccountMutationResult, loading }
  ] = useMutation<CreateAccountMutation, CreateAccountMutationVariables>(
    CREATE_ACCOUNT_MUTATION,
    { onCompleted }
  );
  const onSubmit = () => {
    console.log(createAccountMutationResult);
    if (!loading) {
      const { email, password, role } = getValues();
      createAccountMutation({
        variables: {
          createAccountInput: {
            email,
            password,
            role
          }
        }
      });
    }
  };
  return (
    <div className="h-screen flex items-center flex-col mt-10 lg:mt-28">
      <Helmet>
        <title> Create Account | Uber Eats </title>
      </Helmet>
      <div className="w-full max-w-screen-sm flex flex-col px-5 items-center">
        <img src={uberLogo} className="w-52 mb-10" />
        <h4 className="w-full font-medium text-left text-3xl mb-5">
          Let's get started
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
          <select
            {...register('role', { required: true })}
            name="role"
            className="input"
          >
            {Object.keys(UserRole).map((role, index) => (
              <option key={index}> {role}</option>
            ))}
          </select>
          <Button
            canClick={isValid}
            loading={loading}
            actionText={'Create an Account'}
          />
          {createAccountMutationResult?.createAccount.error && (
            <FormError
              errorMessage={createAccountMutationResult.createAccount.error}
            />
          )}
        </form>
        <div>
          Already have an account?{' '}
          <Link to="/login" className="text-lime-600 hover:underline">
            Log in now
          </Link>
        </div>
      </div>
    </div>
  );
}
