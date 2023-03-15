import { gql, useApolloClient, useMutation } from '@apollo/client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/button';
import { useMe } from '../../hooks/useMe';
import {
  EditProfileMutation,
  EditProfileMutationVariables
} from '../../__generated__/graphql';

interface IFormProps {
  email?: string;
  password?: string;
}

const EDIT_PROFILE_MUTATION = gql`
  mutation editProfile($input: EditProfileInput!) {
    editProfile(input: $input) {
      ok
      error
    }
  }
`;

export const EditProfile = () => {
  const { data: userData, refetch } = useMe();
  const client = useApolloClient();
  const { register, handleSubmit, getValues, formState } = useForm<IFormProps>({
    mode: 'onChange',
    defaultValues: {
      email: userData?.me.email
    }
  });
  const onCompleted = async (data: EditProfileMutation) => {
    const {
      editProfile: { ok }
    } = data;
    if (ok && userData) {
      await refetch();
      // update cache
      // const {
      //   me: { email: prevEmail, id }
      // } = userData;
      // const { email: newEmail } = getValues();
      // if (prevEmail !== newEmail) {
      //   client.writeFragment({
      //     id: `User:${id}`,
      //     fragment: gql`
      //       fragment EditedUser on User {
      //         verified
      //         email
      //       }
      //     `,
      //     data: {
      //       email: newEmail,
      //       verified: false
      //     }
      //   });
      // }
    }
  };
  const [editProfileMutation, { data: loading }] = useMutation<
    EditProfileMutation,
    EditProfileMutationVariables
  >(EDIT_PROFILE_MUTATION, {
    onCompleted
  });
  const onSubmit = () => {
    if (!loading) {
      const { email, password } = getValues();
      editProfileMutation({
        variables: {
          input: {
            email,
            ...(password !== '' && { password })
          }
        }
      });
    }
  };
  return (
    <div className="mt-52 flex flex-col justify-center items-center">
      <h4 className="font-semibold text-2xl mb-3">Edit Profile</h4>
      <form
        className="grid max-w-screen-sm gap-3 mt-5 w-full mb-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <input
          {...register('email', {
            pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
          })}
          name="email"
          className="input"
          type="email"
          placeholder="Email"
        />
        <input
          {...register('password', {
            minLength: 10
          })}
          name="password"
          className="input"
          type="password"
          placeholder="Password"
        />
        <Button
          loading={false}
          canClick={formState.isValid}
          actionText="Update Profile"
        />
      </form>
    </div>
  );
};
